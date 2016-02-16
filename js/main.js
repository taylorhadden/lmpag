$(document).ready(function() {

    var $form = $('#logical-machines-quote-generator');
    
    /*
     * Validation criteria
     */

	var email = {
		email: true 
	};
	var emailMessages = {
		emails : "Please enter a valid email address."
	};
	var requiredEmail = {
		required : true,
		email: true
	};
	var requiredEmailMessages = {
		required : "Please enter an email address.",
		emails : "Please enter a valid email address."
	};
	var requiredField = {
		required : true
	};
	var requiredFieldMessages = {
		required : "Please fill in your details."
	};
	$form.validate({
		rules : {
			to : requiredEmail,
			cc : email,
			name : requiredField,
			company : requiredField
		},
		messages : {
			to : requiredEmailMessages,
			cc : emailMessages,
			name : requiredFieldMessages,
			company : requiredFieldMessages
		}
	});

	/*
	* Declare global variables
	*/

	// Retreive list of spouts available for sale from the HTML
	var spoutSizes = $('input[name=spout-sizes]').val(),
	spoutSizes = spoutSizes.replace(/\s+/g,''),
	availableSpouts = spoutSizes.split(','),
	// Field containers
	$fieldContainer = $('.field-container'), 
	$machineModel = $('#field-name-machine-model'), 
	$weighHopper = $('#field-name-weigh-hopper'), 
	$dischargeFunnel = $('#field-name-discharge-funnel'), 
	$spout = $('#field-name-spout'), 
	$spout1 = $spout.find('#spout1'), 
	$spout2 = $spout.find('#spout2'), 
	$spout3 = $spout.find('#spout3'),
	// Field labels for extracting data
	$machineData = $machineModel.find('label'), 
	$weighHopperData = $weighHopper.find($('label')), 
	$dischargeFunnelData = $dischargeFunnel.find($('label')), 
	spoutPrice = parseInt($('input[name=spout-price]').val()),
	// Machine image variables
	$machineImage = $('#machine-image'), 
	$spoutImage = $machineImage.find('.spout'), 
	$nextMachineImage = $('#machine-image').next('#machine-title'), 
	$grandTotalContainer = $('#cost-container .amount'), 
	grandTotal = parseInt($grandTotalContainer.text(), 10),
	// Controls
	$btnAdd = $('#btnAdd'), 
	$btnDel = $('#btnDel'), 
	$btnEmail = $('#btnEmail'), 
	$btnSubmit = $('#btnSubmit');

	// Create an instance of the machine object and default assign properties
	var machine = {
		id : $machineData.first().attr('for'),
		name : $machineData.first().find('.name').text(),
		type : $machineData.first().find('.type').text(),
		description : $.trim($machineData.first().find('.description').text()),//.trim(),
		price : $machineData.first().find('.amount').text(),
		weighHopper : {
			id : $weighHopperData.first().attr('for'),
			name : $weighHopperData.first().find('.name').text(),
			description : $.trim($weighHopperData.first().find('.description').text()),//.trim(),
			price : $weighHopperData.first().find('.amount').text()
		},
		dischargeFunnel : {
			id : $dischargeFunnelData.first().attr('for'),
			name : $dischargeFunnelData.first().find('.name').text(),
			description : $.trim($dischargeFunnelData.first().find('.description').text()),//.trim(),
			price : $dischargeFunnelData.first().find('.amount').text()
		},
		spouts : {
			// This is a dictionary of spouts
		}
	};
	
	
	/*
	Logical Object Creation

	There are two types of objects: MachineOptions and ConfigurationSteps

	A MachineOption can have many MachineOptions as subOptions
	A ConfigurationStep can have many MachineOptions

	A MachineOption belongs to one MachineStep
	Multiple MachineOptions may reference the same object. Each MachineOption in a hierarchy is its own object.

	When a MachineOption is selected
		- deselect all options in the step
		- select current option
		- we get the ConfigurationStep of the first sub-option
		- for each option in the step
			- if the option is not in the sub-option list
				- we hide the option
				- we deselect the option
			- otherwise, we show the option
		- if no sub-option is visible and selected, we select the first sub-option

	*/

	var rootOptions = {};

	var optionLookup = {};

	function MachineOption(domElement) {
		this.element = domElement;
		this.subOptions = [];
	}
	MachineOption.prototype.addSubOption = function() {
		for (int i = 0; i < arguments.length; i++) {
			this.subOptions.push(arguments[i]);
			arguments[i].parent = this;
		}
		return this;
	}
	MachineOption.prototype.subStep = function(step) {
		step.addSubOptions(this.subOptions);
	}
	MachineOption.prototype.container = function() {
		return this.element.closest("li");
	}
	MachineOption.prototype.select = function() {
		this.step
	}

	function MO(selector) {
		var option = new MachineOption($(selector));

		// This lets us look up the option by ID
		var lookupList = optionLookup[option.element.attr('id')];
		if (lookupList === undefined) {
			lookupList = [option];
			optionLookup[option.element.attr('id')] = lookupList;
		}
		else {
			lookupList.push(option);
		}

		return option;
	}

	function ConfigurationStep(domElement) {
		this.element = domElement;
		this.options = [];
	}
	ConfigurationStep.prototype.addOption() {
		this.addOptions(arguments);
	}
	ConfigurationStep.prototype.addOptions(list) {
		for (int i = 0; i < list.length; i++) {
			this.options.push(list[i]);
			list[i].step = this;
		}
	}

	// Intialize the Steps
	var modelStep = new ConfigurationStep($("#step-1"));
	var weighHopperStep = new ConfigurationStep($("#step-2"));

	// Initialize the S4 Model Heiarachy
	var s4Option = MO($("#s4")).addSubOption(
			MO($("#stwh")),
			MO($("#lrgwh"))
		).subStep(weighHopperStep);

	var s5Option = MO($("#s5")).addSubOption(
			MO($("#no-wh"))
		).subStep(weighHopperStep);

	var s6Option = MO($("#s6").addSubOption(
			MO($("stwh")),
			MO($("lrgwh"))
		).subStep(weighHopperStep);

	var s7Option = MO($("#s7"));

	modelStep.addOption(s4Option, s5Option, s6Option, s7Option);

	/*
	* Document ready JS
	*/

	// Hide fallback content, add and delete button
	$('#field-name-discharge-funnel .large, .field-name-dimensions li, #step-2, #step-3, #step-4, #step-5, #hidden-accessories-page, .container-shape-images > *, #btnAdd, #btnDel, .calculate, .spout-calculation, .field-spout .instructions p, #emailQuote, .field-spout .warning, #sending').hide();
	$('.field-spout .instructions p.spout-selection').show();
	// Remove fallback form elements
	$('.fallback-field-spout,.fallback-discharge-funnel,input[name=nojs]').remove();
	$btnSubmit.val('Send Email');
	// .bottom class puts a negative z-index on the hidden
	// accessories page so that it loads underneath the rest of
	// the content. This removes that class on load.
	$('.bottom').removeClass('bottom');
	// Hide all but the first machine model description
	$machineData.children(':not(h4,.price)').hide();
	// Remove .hidden class from JS ready content
	$('#field-name-discharge-funnel li, #btnAdd, #btnDel, #btnFront, #btnSide, .field-spout, .step-submit, #sidebar, #btnPrint, #btnEmail,#btnClose, #btnContinue, .quote-summary, #hidden-accessories-page, #machine-title, #quote-summary, #sending').removeClass('hidden');
	// Check the fallback discharge funnel field
	$dischargeFunnel.find($('.small #small-std-fnl')).prop('checked', true).addClass('active');
	// Remove the no-sidebar class for fallback
	$('#main-content').removeClass('no-sidebar');

	/* 
       Add a waypoint to the sidebar
       var $mi_container = $('#sidebar');
       Set the .sticky class when waypoint is reached
       $mi_container.waypoint(function(direction) {
       $('#machine-image-container').toggleClass('sticky',
       direction === 'down');
       });
    */

	// Create a div on each page for the pager button
	$('.step-container').each(function() {
		containerID = $(this).attr('id');
		$('<div/>', {
			id : containerID + '-pager',
			"class" : 'step-pager'
		}).appendTo($(this));
	});
	// Create pager buttons and add them to the created div
	$('.step-pager').not(':first').append($('<a/>', {
		"class" : 'prev button',
		"href" : '#',
	}).text('Previous step'));
	$('.step-pager').not(':last').append($('<a/>', {
		"class" : 'next button',
		"href" : '#',
	}).text('Next step'));

	/*
	* General functions
	*/

	// Capitalise first letter of a variable
	String.prototype.capitalise = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}

	// Calculate the grand total frome the machine object
	function calculateTotalPrice($fieldID) {
		var price = 0;

		price += parseFloat(machine.price);
		price += parseFloat(machine.weighHopper.price);
		price += parseFloat(machine.dischargeFunnel.price);

		for (var id in machine.spouts) {
			price += parseFloat(machine.spouts[id].price);
		}

		$grandTotalContainer.html(price);
	}

	// Change the machine image between front and side view
	$('#machine-image-container').on('click', 'button', function() {
		var btnDirection = $(this).attr('id');
		if(!$(this).hasClass('active')) {
			$('#machine-image-container button').toggleClass('active');
		}
		if (btnDirection === 'btnFront') {
			$machineImage.addClass('front').removeClass('side');
		}
		else {
			$machineImage.addClass('side').removeClass('front');
		}
	});

    /*
     *  Navigation
     */

    // This causes no state change, only view change.
    // It is called by clicking on the left-hand tabs and
    // By the previous/next buttons on each page.
	function switchToStep(stepID) {
		changeCostContainerText();

		var stepContainer = $("#" + stepID);
		// Remove active state from old step tab
		$('#pag-navigation a').removeClass('active');
		// Set active state for current step tab
		$('#pag-navigation a[data*=' + stepID + ']').addClass('active');

		$('.step-container').hide();
		stepContainer.show();

		if (stepID === "step-5") {
			showValues();
		}

		$('#thankYouMessage').remove();
	}

	// Action for 'prev' & 'next' buttons
	$('.step-pager .button').click(function() {
		console.log("Previous / Next Button Clicked");

		// Determine the next step ID
		var $stepContainer = $(this).closest('.step-container');
		
		var switchingToID;
		if ($(this).is('.next')) {
			switchingToID = $stepContainer.next().attr('id');
		}
		else {
			switchingToID = $stepContainer.prev().attr('id');
		}

		// Apply the switch to the ID
		switchToStep(switchingToID);
	});

	// Action for left-hand step tabs
	$('#pag-navigation a').click(function() {
		var stepID = $(this).attr('data');
		switchToStep(stepID);
	});


	
	function defaultHopperS4 () {
		$('#stwh').prop('checked', true).trigger('change');
	}
	
	function defaultHopperS5 () {
		$('#no-wh').prop('checked', true).trigger('change');
	}
	
	function defaultHopperS6 () {
		$('#smwh').prop('checked', true).trigger('change');
	}
	
	function defaultFunnelS6 () {
		$('#discharge-cht').prop('checked', true).trigger('change');
		$('.fu6').show();
	}
	function defaultSpoutS6 () {
		$('.not-s6').hide();
		$('#field-name-spout').hide();
		$('.s6-sp').show();
	}

	// Display Base Price as title on the front page and Price as Configured on every other page
	function changeCostContainerText() {
		var costContainerText = $('#cost-container .title').text(); 
		if (costContainerText !== 'Price as Configured:') {
			$('#cost-container .title').text('Price as Configured:');
		}
	}
	

	// Recursive selection based on the radio input that is selected
	function selectOption(optionElement) {
		var input = $(optionElement);
		var label = input.next("label");
		var optionID = input.attr('id');

		var name = input.attr('name');
		
		var previousInput = $("input[name='" + name + "'].active").not(input);
		
		input.addClass('active');
		previousInput.removeClass('active');

		fieldContainerID = input.closest($fieldContainer).attr('id')

		console.log("Selected a " + name);
		console.log("Changing selection from " + previousInput.attr('id') + ", to " + input.attr('id'));

		var nextOptionSet = null;
		var nextOptionTag = null;

		// Selecting a base machine
		if (name === "machinemodel") {
			
			// Update the machine object
			machine.id = optionID;
			machine.name = label.find('.name').text();
			machine.type = label.find('.type').text();
			machine.description = $.trim(label.find('.description').text())//.trim();
			machine.price = label.find('.amount').text();

			// Show/Hide descriptions
			$machineData.children(':not(h4,.price)').hide();
			label.find('*').show();

			// Assign classes to machine image and change name displayed below
			$machineImage.removeClass('s4 s5 s6 s7').addClass(machine.id);
			$nextMachineImage.html(machine.name + " " + machine.type);

			// Check machine type and show relevant weigh hoppers
			nextOptionSet = $weighHopper;
			nextOptionTag = "." + input.closest('li').attr('class');
		}
		else if (name === 'weighhopper') {
			// Assign properties to the machine.weighHopper object
			machine.weighHopper.id = optionID;
			machine.weighHopper.name = label.find('.name').text();
			machine.weighHopper.description = $.trim(label.find('.description').text())//.trim();
			machine.weighHopper.price = label.find('.amount').text();

			// Assign classes to machine image
			$machineImage.removeClass('stwh lrgwh std-fnl steep-fnl').addClass(optionID + ' std-fnl');

			nextOptionSet = $dischargeFunnel;
			nextOptionTag = "." + $machineModel.find('input[type=radio].active').closest('li').attr('class')
		}
		else if (name === 'dischargefunnel') {
			// Assign properties to the machine.dischargeFunnel object
			machine.dischargeFunnel.id = input.attr('id');
			machine.dischargeFunnel.name = input.find('.name').text();
			machine.dischargeFunnel.description = $.trim(label.find('.description').text())//.trim();
			machine.dischargeFunnel.price = label.find('.amount').text();

			// Assign classes to machine image
			if (machine.weighHopper.id == 'lrgwh') {
				if ( machine.dischargeFunnel.id == 'large-std-fnl') {
					$machineImage.removeClass('std-fnl steep-fnl').addClass('std-fnl');
				}
				else {
					$machineImage.removeClass('std-fnl steep-fnl').addClass('steep-fnl');
				}
			}
			else {
				$machineImage.toggleClass('std-fnl steep-fnl');
			}
		}
		else if (fieldContainerID === 'field-name-spout') {
			var fieldVal = input.val(), 
			$spoutContainer = input.closest('fieldset');

			// Show calculate button
			$spoutContainer.find('.calculate').show();

			// Toggle active class
			$spoutContainer.find('input.active').removeClass('active');
			input.addClass('active');

			// Hide all the dimensions fields and images
			$spoutContainer.find('.field-name-dimensions li').hide();
			$spoutContainer.find('.container-shape-images > *').hide();
			$spoutContainer.find('p').hide();

			// Show the appropriate instructions and fields for the spout type choice
			$spoutContainer.find('.instructions .' + fieldVal).show();
			$spoutContainer.find('.field-name-dimensions .' + fieldVal).show();
			$spoutContainer.find('.container-shape-images .' + fieldVal).show();
		}

		if (nextOptionSet != null && nextOptionTag != null) {
			// Closes all sets and opens the ones with the appropriate tag
			nextOptionSet.find('li').hide().filter('.' + nextOptionTag).show();

			var foundVisibleSelectedOption = false;
			nextOptionSet.find('li .' + nextOptionTag).each(function() {
				if (this.style.display != 'none') {
					foundVisibleSelectedOption = true;
					return false;
				}
			});

			if (!foundVisibleSelectedOption) {
				// Select the first visible option
				selectOption(nextOptionSet.find('li ' + nextOptionTag).first().find("input[type=radio]")[0]);
			}
		}
		
	}

    /*
     * Pages 1 - 4 selection actions
     */

	$fieldContainer.on('change', 'input[type=radio]', function(e) { // Action when choosing options - registers & indicates selection, determines knock-on choices, updates image, updates cost.
		var id = this.id;

		

		//selectOption(this);
		calculateTotalPrice();
	});

	/*
	 *  'Select spouts' page
	 */
	
	// Calculate the size of the spout based on the container
	$spout.on('click', '.calculate', function() {
		var num = $('fieldset.field-spout').length, 
		$spoutContainer = $(this).closest('fieldset'), 
		spoutTitle = $.trim($spoutContainer.find('legend').text())//.trim(),
		// The selected spout type
		$spoutSelected = $spoutContainer.find('.field-name-spout-type input:checked'), 
		spoutSelectedVal = $spoutSelected.val(), 
		spoutSelectedTitle = $spoutSelected.next('label').find('h4').text(),
		// Spout dimension values
		dimensionFieldWidth = parseFloat($spoutContainer.find('.width input').val()), 
		dimensionFieldD1 = parseFloat($spoutContainer.find('.d1 input').val()), 
		dimensionFieldD2 = parseFloat($spoutContainer.find('.d2 input').val()), 
		dimensionFieldDiameter = $spoutContainer.find('.diameter input').val(), 
		spoutSize = null,
		// Visisble dimension fields
		$dimensionFieldsVisible = $spoutContainer.find('.field-type-textfield input').filter(":visible");
		// If the fields are valid, calculate the spout size
		if ($dimensionFieldsVisible.valid()) {
			switch (spoutSelectedVal) {
				case 'flat-bag':
					var containerDiameter = dimensionFieldWidth * 2 / Math.PI, spoutSize = nearestSpout(containerDiameter);
					break;
				case 'four-sided-bag':
					var containerDiameter = (dimensionFieldD1 + dimensionFieldD2) * 2 / Math.PI, spoutSize = nearestSpout(containerDiameter);
					break;
				case 'can-jar':
					$.each(availableSpouts, function() {
						if (spoutSize == null || dimensionFieldDiameter - this >= 0.125) {
							spoutSize = this;
						}
					});
					break;
			}
			spoutSize = parseFloat(spoutSize);
			// Display a warning if the spout size is the same as an existing one else run spoutValid()
			var calculatedSpoutSizes = [];
			$('.spout-calculation .spout-size').each(function(){
				calculatedSpoutSizes.push(parseFloat($.trim($(this).text())));
			});
			if (calculatedSpoutSizes.length !== 0 && $.inArray(spoutSize, calculatedSpoutSizes) !== -1) {
				$spoutContainer.find('.warning').show().find('.calculatedSpoutSize').text(spoutSize);
			}
			else {
				approveSpout(num, $spoutContainer, spoutTitle, spoutSize);
			}
		}
	});
	
	// Find out what the nearest spout is to the calculated spout size
	function nearestSpout(containerDiameter) {
		var closest = null, calculatedSpoutSize = Math.round(containerDiameter * 0.72 * 1000) / 1000;
		$.each(availableSpouts, function() {
			if (closest == null || Math.abs(this - calculatedSpoutSize) < Math.abs(closest - calculatedSpoutSize)) {
				closest = this;
			}
		});
		return closest;
	}
	
	function approveSpout(num, $spoutContainer, spoutTitle, spoutSize) {
		// Hide invalid warning message
		$spoutContainer.find('.warning').hide();
		// Show add button when the number of fields is less that 3
		if (num < 3) {
			$btnAdd.show();
		}
		// Slide the fieldset up and display the results and edit button
		$spoutContainer.slideUp('fast', function() {    
			$spoutContainer.after('<p class="spout-calculation"><span class="spoutNum">' + spoutTitle + '</span>: <span class="spout-size">' + spoutSize + '</span>"<button type="button" class="btnRemove" value="Remove spout">Remove</button><button type="button" class="btnEdit" value="Edit spout">Edit</button></p>');
		});
		// Show delete button
		$btnDel.show().prop('disabled', false);
		// Adjust the grand total
		// Show the spout image
		if ($spoutImage.hasClass('hidden')) {
			$spoutImage.removeClass('hidden');
			$machineImage.removeClass('no-spout');
			$machineImage.addClass('spout');
		}

		var spout = spoutObjectForSpoutWrapperElement($spoutContainer.closest(".spout-wrapper"));
		machine.spouts[spout.id] = spout;
		calculateTotalPrice();
	}
	
	// Buttons for adding, removing and editing spouts
	
	// Add button
	$btnAdd.click(function() {
		// Find out the amount of existing fields and add the next number
		var num = $('fieldset.field-spout').length, newNum = +num + 1,
		// The numeric ID of the new input field being added
		newSpoutID = 'spout' + newNum, newSpoutIDUpper = newSpoutID.capitalise(), newSpoutTypeID = "type" + newSpoutIDUpper,
		// Create the new element via clone() give it the new ID using newNum value
		$newElem = $('#spout' + num).clone().attr('id', newSpoutID);
		// Manipulate the name/id values of the spout type inputs inside the new element
		fillSpoutElement($newElem,newNum,newSpoutID,newSpoutIDUpper,newSpoutTypeID);
		// Show spout type fields and reset
		$newElem.find('.field-name-spout-type').show().find('input').prop('checked', false).removeClass('active');
		// Reset the field descriptions
		$newElem.find('.description').show().find('p').hide().filter('.spout-selection').show();
		// Reset the dimension fields
		$newElem.find('.field-name-dimensions li').hide().find('input').prop('disabled', false).val("");
		// Hide container shape images
		$newElem.find('.container-shape-images > *').hide();
		// Remove spout calculation result and hide the calculate button
		$newElem.find('.spout-calculation').remove();
		$newElem.find('.calculate').hide();
		$newElem.find('fieldset').slideDown('fast');
		// Insert the new element after the last spout
		$('#spout' + num).after($newElem);
		// enable the "remove" button and hide the 'add'
		// button
		$btnDel.show().prop('disabled', false);
		$btnAdd.hide();
	});

	// Remove button
	$('#field-name-spout').on('click', '.btnRemove', function() {
		var num = $('fieldset.field-spout').length, 
			$spoutField = $("#spout" + num), 
			$spoutWrapper = $(this).closest('.spout-wrapper'), 
			$spoutFieldset = $spoutWrapper.find('fieldset');
		if (num == 1) {
			$spoutField.find('fieldset').slideDown().find('.calculate').hide();
			$spoutField.find('.field-name-spout-type').show().find('input').removeClass('active').prop('checked', false); 
			$spoutField.find('.instructions').show().find('p').hide().filter('.spout-selection').show();
			$spoutField.find('.field-name-dimensions,.container-shape-images').show();
			$spoutField.find('.field-name-dimensions li').hide().find('input').prop('disabled', false).val("");
			$spoutField.find('.container-shape-images > *').hide();
			$spoutField.find('.spout-calculation').remove();
			$btnAdd.hide();
			$btnDel.hide();
			$spoutImage.addClass('hidden');
			$machineImage.removeClass('spout');
		}
		else {
			// Show the 'add another spout' button
			$btnAdd.show();
			// Delete the spout
			$spoutWrapper.remove();
			// Reset the ID and label numbering for the remaining fields
			machine.spouts = {};
			$('.spout-wrapper').each(function(index) {
				var $newElem = $(this); newNum = index + 1, newSpoutID = 'spout' + newNum, newSpoutIDUpper = newSpoutID.capitalise(), newSpoutTypeID = "type" + newSpoutIDUpper;
				fillSpoutElement($newElem,newNum,newSpoutID,newSpoutIDUpper,newSpoutTypeID);
				$newElem.find('.spout-calculation .spoutNum').text('Spout ' + newNum);
				var spout = spoutObjectForSpoutWrapperElement($newElem);
				machine.spouts[spout.id] = spout;
			});
		}
		// Adjust the spout price
		calculateTotalPrice();
		// Show the "add" button if the 3rd spout is being removed
		if (num == 3) {
			$btnAdd.show();
		}
	});
	
	function fillSpoutElement($newElem,newNum,newSpoutID,newSpoutIDUpper,newSpoutTypeID) {
		$newElem.attr('id', newSpoutID).find('legend').html('Spout ' + newNum).next().find('input').attr({
			"id" : function(arr) {
				return "type" + (arr + 1) + newSpoutIDUpper;
			},
			'name' : newSpoutTypeID
		}).next().attr('for', function(arr) {
			return "type" + (arr + 1) + newSpoutIDUpper;
		});
		$newElem.find('.field-name-dimensions li input').attr('name', function(index, attr) {
			attr = attr.substring(0, attr.length - 1);
			return attr + newNum;
		});

	}

	function spoutObjectForSpoutWrapperElement(spoutWrapper) {

		var spoutObject = {
			id : spoutWrapper.attr('id'),
			price : spoutPrice
		};

		return spoutObject;
	}
	
	// Edit button
	$('#field-name-spout').on('click', '.btnEdit', function() {
		// Get spout wrapper and related form in objects:
		var $spoutWrapper = $(this).closest('.spout-wrapper'), 
			$spoutFieldset = $spoutWrapper.find('fieldset');
		// Show still-complete form and delete spout-calculation
		$spoutFieldset.slideDown('fast').next().remove();
		
		var spout = spoutObjectForSpoutWrapperElement($spoutWrapper);
		delete machine.spouts[spout.id];
		calculateTotalPrice();

		//Show add button:
		$btnAdd.hide();
	});
	
	/*
	 *  Hidden accessories page
	 */

	$('#hidden-accessories-page-btn').click(function() {
		$('#hidden-accessories-page').show();
	});
	$('#btnClose,#btnContinue').click(function() {
		$(this).closest('.step-container').hide();
	});
	
	/*
	 *  Display, Email and Print Summary
	 */
	
	// Retrieve form values for display on summary
	function showValues() {
		// Create the machine type, weight hopper and discharge funnel rows for the summary table
		var resultsHTML = '<tr bgcolor="#EBFFEA"><th style="text-align:right;border-right: 1px solid #0c4b81;">' + machine.name + ' ' + machine.type + '</th><td>' + machine.description + '</td><td>$' + machine.price + '</td></tr><tr><th style="text-align:right;border-right: 1px solid #0c4b81;">' + machine.weighHopper.name + '</th><td>' + machine.weighHopper.description + '</td><td>$' + machine.weighHopper.price + '</td></tr><tr bgcolor="#EBFFEA"><th style="text-align:right;border-right: 1px solid #0c4b81;">' + machine.dischargeFunnel.name + '</th><td>' + machine.dischargeFunnel.description + '</td><td>$' + machine.dischargeFunnel.price + '</td></tr>',
		// Create the spout rows for the summary table
		num = parseInt($('.spout-size').text());
		if (!isNaN(num)) {
			$('.spout-size').each(function() {
				resultsHTML += '<tr><th style="text-align:right;border-right: 1px solid #0c4b81;">Spout</th><td>' + $(this).text() + ' inch</td><td>$' + spoutPrice + '</td></tr>';
			});
		}
		// Create the total row for the summary table
		resultsHTML += '<tr class="total" style="text-align:right;border-top:1px solid #0c4b81;"><td>&nbsp;</td><th>Total:</th><td>$' + grandTotal + '</td></tr>';
		// Empty the current summary table and add the new rows in
		$('#results').empty().append(resultsHTML);
		// Stripe the results table
		$('#results tr').filter(':even').addClass('even').css("background-color", "#EBFFEA");
		return resultsHTML;
	}

	// Print button action
	$('#btnPrint').click(function() {
		window.print();
		return false;
	});

	// Email button action
	$btnEmail.on('click', function() {
		// Change the button value
		var btnEmailText = $(this).val();
		if (btnEmailText == 'Cancel Email') {
			$(this).text('Email Quote').val('Email Quote');
		}
		else {
			$(this).text('Cancel Email').val('Cancel Email');
			$('#thankYouMessage').remove();
		}
		// Slide out the email form
		$('#emailQuote').slideToggle('fast');
	});

	// Email send button action
	$btnSubmit.on('click', function() {
		var $disabled = $form.find('input:disabled').prop('disabled', false), quoteSummary = $('#quote-summary').html(), spoutRowsText = '', num = parseInt($('.spout-size').text());
		// Add spout rows to the email
		if (!isNaN(num)) {
			$('.spout-size').each(function() {
				spoutRowsText += 'Spout: ' + $(this).text() + ' inch $ - ' + spoutPrice + '\r';
			});
		}
		// Compile the values from the form
		var to = $('#to').val(),
		cc = $('#cc').val(),
		company = $('#company').val(),
		name = $('#name').val(),
		message = $.trim(encodeURIComponent($('#message').val())),
		$emailFields = $('#to,#cc'),
		$names = $('#company,#name'),
		$HTMLresults = showValues(),
		$HTMLresults = $HTMLresults.replace(/\"/g,''),
		$HTMLheader = '<table border=0 cellpadding=10 cellspacing=0 style=margin:14px;border-collapse:collapse;><thead style=border-bottom:1px solid #0c4b81;><tr><th style=text-align:right;>Item</th><th style=text-align:left;>Description</th><th style=text-align:left;>Price</th></tr></thead><tbody>', 
		$HTMLfooter = '</tbody></table>',
		quoteHTML =  encodeURIComponent($HTMLheader + $HTMLresults + $HTMLfooter), 
		quoteText = encodeURIComponent(machine.name + " " + machine.type + " - $" + machine.price + "\r" + machine.description + "\r\r" + machine.weighHopper.name + " - $" + machine.weighHopper.price + "\r" + machine.weighHopper.description + "\r\r" + machine.dischargeFunnel.name + " - $" + machine.dischargeFunnel.price + "\r" + machine.dischargeFunnel.description + "\r\r" + spoutRowsText + "\rTotal: $" + grandTotal);
		// Create the datastring from the form values
		var dataString = 'to=' + to + '&cc=' + cc + '&name=' + name + '&company=' + company + '&message=' + message + '&quoteHTML=' + quoteHTML + '&quoteText=' + quoteText;
		// Send the email via an AJAX request the PHP script
		if ($emailFields.valid()) {
			$('#sending').show();
			$('#btnSubmit').prop('disabled', true);
			$.ajax({
				type : "POST",
				url : "bin/email_processing.php",
				data : dataString,
				success : function(response) {
					$btnEmail.text('Email Quote').val('Email Quote');
					$('#emailQuote').slideToggle('fast').find('input').not('input[type=submit]').val('');
					$('#quote-summary').after("<div id='thankYouMessage'></div>");
					$('#thankYouMessage').html("<h3>Thank you.</h3>").append("<p>Your email has been sent to the recipients your entered.</p>");
					$('#sending').hide();
					$('#btnSubmit').prop('disabled', false);
				}
			});
			return false;
		}
	});

});
