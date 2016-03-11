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
	// Chute Size Controls
	$chuteSizeSelection = $(".chuteSizeSelection");

	// Create an instance of the machine object and default assign properties
	// Note that "priceSupplement" and "descriptionSupplement" are also supported options for a part model
	var machine = {
		// The machine does not auto-fill values. The schema is as follows:
		/*
		part-id : {
			id : the part id,
			name : the part name
			type : (optional) the part type
			description : the description of the part
			price : the price of the part
		}
		*/

		// The expected values are as follows:
		/*
		model : the actual model of the machine,
		supplyHopper : (optional) the supply hopper for the S7
		weighHopper : the weigh hopper for the machine
		dischargeFunnel : the discharge funnel, includes the discharge chute
		*/

		// Chute size and apapters are added as necessary
		
		// The "spouts" and "accessories" name is special. It is a list of sub-parts, each using the base part schema
		spouts : {
			// This is a dictionary of spouts
		},
		accessories : {
			// This is a dictionary of accessories
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

	/*
	
	Establishing the Object API

	*/

	// Machine Option
	function MachineOption(domElement) {
		this.element = domElement;
		this.subOptions = [];
	}
	MachineOption.prototype.addSubOption = function() {
		for (var i = 0; i < arguments.length; i++) {
			this.subOptions.push(arguments[i]);
			arguments[i].parent = this;
		}
		return this;
	}
	MachineOption.prototype.useSubStep = function(step) {
		step.addOptions(this.subOptions);
		return this;
	}
	MachineOption.prototype.container = function() {
		return this.element.closest("li");
	}
	MachineOption.prototype.isSelected = function() {
		return this.element.hasClass("active");
	}
	MachineOption.prototype.selectedChild = function() {
		for (var i = 0; i < this.subOptions.length; i++) {
			if (this.subOptions[i].isSelected()) {
				return this.subOptions[i];
			}
		}
		return null;
	}
	MachineOption.prototype.pathName = function(name) {
		if (name === undefined) {
			name = this.element.attr('id');
		}
		else {
			name = this.element.attr('id') + "/" + name;
		}
		if (this.parent !== undefined) {
			name = this.parent.pathName(name);
		}
		return name;
	}
	MachineOption.prototype.select = function() {
		console.log("selecting: " + this.pathName());

		for (var i = 0; i < this.step.options.length; i++) {
			var option = this.step.options[i];
			if (option.isSelected() && option.element.attr("id") != this.element.attr("id") && option.step.exclusive) {
				option.deselect();
			}
		}

		this.selectElement();

		if (this.onSelects !== undefined) {
			for (var i = 0; i < this.onSelects.length; i++) {
				this.onSelects[i].call(this);
			}
		}

		if (this.subOptions.length > 0) {
			var subStep = this.subOptions[0].step;

			subStep.options.forEach(function(option) {
				option.container().hide();
			});

			this.subOptions.forEach(function(option) {
				option.container().show();
			});

			var selectedChild = this.selectedChild();
			if (selectedChild === null) {
				this.subOptions[0].select();
			}
			else {
				selectedChild.select();
			}
		}
	}
	// This is pulled out to make mucking with the odd sections easier
	MachineOption.prototype.selectElement = function() {
		this.element.addClass('active');
		this.element.prop("checked", true);
	}
	MachineOption.prototype.onSelect = function(method) {
		if (this.onSelects === undefined) {
			this.onSelects = [];
		}
		this.onSelects.push(method);
		return this;
	}
	MachineOption.prototype.deselect = function() {
		console.log("Deselecting " + this.pathName());
		this.deselectElement();
		if (this.onDeselects !== undefined) {
			for (var i = 0; i < this.onDeselects.length; i++) {
				this.onDeselects[i].call(this);
			}
		}
	}
	// This is pulled out to make mucking with the odd sections easier
	MachineOption.prototype.deselectElement = function() {
		this.element.removeClass('active');
		this.element.prop('checked', false);
	}
	MachineOption.prototype.onDeselect = function(method) {
		if (this.onDeselects === undefined) {
			this.onDeselects = [];
		}
		this.onDeselects.push(method);
		return this;
	}

	
	// Configuration Steps
	function ConfigurationStep(domElement) {
		this.element = domElement;
		this.options = [];
		this.exclusive = true;
	}
	ConfigurationStep.prototype.addOption = function() {
		this.addOptions(arguments);
	}
	ConfigurationStep.prototype.addOptions = function(list) {
		for (var i = 0; i < list.length; i++) {
			this.options.push(list[i]);
			list[i].step = this;
		}
	}
	ConfigurationStep.prototype.hideAll = function() {
		// This hides all real dom children
		this.element.find("li").hide();
	}

	/*

	Creating the logical objects

	*/
	// Lookup dictionaries
	var rootOptions = {};
	var optionLookup = {};

	// Intialize the Steps
	var modelStep = new ConfigurationStep($("#step-1"));
	var weighHopperStep = new ConfigurationStep($("#step-2"));
	var dischargeFunnelStep = new ConfigurationStep($("#step-3"));
	var insertionStep = new ConfigurationStep($("#step-4"));
	var accessoryStep = new ConfigurationStep($("#step-5"));
	accessoryStep.exclusive = false;


	// Creation Methods
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

	function partFromElement(element) {
		var label = element.next("label");
		var part = {
			id : element.attr("id"),
			name : label.find(".name").text(),
			description : $.trim(label.find('.description').text()),
			price : label.find('.amount').text()
		}
		// Optional values
		var type = label.find(".type").text();
		if (type) {
			part.type = type;
		}
		return part;
	}

	function makeMachine(selector) {
		var machineOption = MO(selector);

		modelStep.addOption(machineOption);

		// Tack on other furnctions
		machineOption.onSelect(function() {
			machine.model = partFromElement(this.element);

			// Show/Hide descriptions
			$machineData.children(':not(h4,.price)').hide();
			var label = this.element.next("label");
			label.find('*').show();

			// Assign classes to machine image and change name displayed below
			$machineImage.removeClass('s4 s5 s6 s7').addClass(machine.model.id);
			var name = machine.model.name;
			if (machine.model.type) {
				name += " " + machine.model.type;
			}
			$nextMachineImage.html(name);

			// Check for accessory compatibility
			for (var i = 0; i < accessoryStep.options.length; i++) {
				var accessory = accessoryStep.options[i];
				var approved = false;
				for (var j = 0; j < accessory.applicableMachines.length; j++) {
					if (accessory.applicableMachines[j] === this) {
						approved = true;
						break;
					}
				}
				if (approved) {
					accessory.container().show();
				}
				else {
					if (accessory.isSelected()) {
						accessory.deselect();	
					}
					accessory.container().hide();
				}
			}
		});

		return machineOption;
	}

	function makeWeighHopper(selector) {
		var weighHopper = MO(selector);

		weighHopperStep.addOption(weighHopper);

		weighHopper.onSelect(function() {
			machine.weighHopper = partFromElement(this.element);

			// Assign classes to machine image
			$machineImage.removeClass('stwh lrgwh std-fnl steep-fnl').addClass(this.element.attr('id') + ' std-fnl');
		});

		return weighHopper;
	}

	function makeDischargeFunnel(selector) {
		var dischargeFunnel = MO(selector);

		dischargeFunnelStep.addOption(dischargeFunnel);

		dischargeFunnel.onSelect(function() {
			var label = this.element.next("label");

			machine.dischargeFunnel = partFromElement(this.element);

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
				if ( machine.dischargeFunnel.id == 'small-std-fnl') {
					$machineImage.removeClass('std-fnl steep-fnl').addClass('std-fnl');
				}
				else {
					$machineImage.removeClass('std-fnl steep-fnl').addClass('steep-fnl');
				}
			}
		});

		return dischargeFunnel;
	}

	// For Spouts and Chutes
	function makeInsertionOption(selector) {
		// This overrides a number of elements of the base Machine Option setup,
		// as it is structured differently.
		var inserter = MO(selector);

		insertionStep.addOption(inserter);

		inserter.isSelected = function() {
			return this.element.css('display') != 'none';
		}
		inserter.selectElement = function() {
			this.element.show();
		}
		inserter.deselectElement = function() {
			this.element.hide();
		}

		return inserter;
	}

	function spoutSelector() {
		var spoutSelector = makeInsertionOption("#SpoutSelector");

		return spoutSelector;
	}

	function paidChuteOptions() {
		var chuteOptions = makeInsertionOption("#ChuteOptions");

		chuteOptions.isSelected = function() {
			return this.element.css('display') != 'none' || this.chuteOptionContainer().css('display') != 'none';
		}

		chuteOptions.chuteOptionContainer = function() {
			return $("#ChuteSizeUpcharge");
		}

		chuteOptions.onSelect(function() {
			this.chuteOptionContainer().show();
			$chuteSizeSelection.trigger("change");
		});

		chuteOptions.onDeselect(function() {
			this.chuteOptionContainer().hide();
			// Deselect the chute adapter and tell it to update;
			$("#ChuteAdapterSelector").prop("checked", false).trigger("change");
			// Reset the chute size customizers and remove the item
			$chuteSizeSelection.val("5");
			delete machine["dischargeFunnel"].priceSupplement;
			delete machine["dischargeFunnel"].descriptionSupplement;
		});

		return chuteOptions;
	}

	function freeChuteOptions() {
		var chuteOptions = paidChuteOptions();

		chuteOptions.chuteOptionContainer = function() {
			return $("#ChuteSizeFree");
		}

		return chuteOptions;
	}

	// Establish callback for the chute option selector
	$("#ChuteAdapterSelector").on("change", function() {
		if ($(this).prop("checked")) {
			machine["chuteAdapter"] = {
				name : "Chute Adapter",
				description : "Include a Chute Adapter",
				price : 250
			}
		}
		else {
			delete machine["chuteAdapter"];
		}
		calculateTotalPrice();
	});

	$chuteSizeSelection.on("change", function() {
		var selector = $(this);
		var option = selector.find("option[value='" + selector.val() + "']");

		var price = 0;
		if (option.attr("data")) {
			price = parseInt(option.attr("data"));
		}

		var piece = machine["dischargeFunnel"];
		piece.priceSupplement = price;
		var description = undefined;
		if (option.index() > 0) {
			description = "Specified " + option.attr('value') + "\" chute";
			if (price > 0) {
				description += " ($" + price + ").";
			}
			else {
				description += ".";
			}
		}
		piece.descriptionSupplement = description;

		console.log("Updating Weigh Hopper Size");
		console.log(piece);
		calculateTotalPrice();
	});

	function makeAccessory() {
		var selector = arguments[0];
		var accessory = MO(selector);
		accessoryStep.addOption(accessory);

		accessory.onSelect(function() {
			var part = partFromElement(this.element);
			machine.accessories[part.id] = part;
		});
		accessory.onDeselect(function() {
			delete machine.accessories[this.element.attr('id')];
		});

		accessory.applicableMachines = [];
		for (var i = 1; i < arguments.length; i++) {
			accessory.applicableMachines.push(arguments[i]);
		}
		return accessory;
	}

	// Initialize the S4 Model Heiarachy
	var s4Option = makeMachine("#s4").addSubOption(
			makeWeighHopper("#stwh").addSubOption(
				makeDischargeFunnel("#small-std-fnl").addSubOption(spoutSelector()),
				makeDischargeFunnel("#small-steep-fnl").addSubOption(spoutSelector()),
				makeDischargeFunnel("#discharge-cht").addSubOption(paidChuteOptions())
			),
			makeWeighHopper("#lrgwh").addSubOption(
				makeDischargeFunnel("#large-std-fnl").addSubOption(spoutSelector()),
				makeDischargeFunnel("#large-steep-fnl").addSubOption(spoutSelector()),
				makeDischargeFunnel("#discharge-cht").addSubOption(paidChuteOptions())
			)
		);

	var s5Option = makeMachine("#s5").addSubOption(
			makeWeighHopper("#no-wh").addSubOption(
				makeDischargeFunnel("#small-std-fnl").addSubOption(spoutSelector()),
				makeDischargeFunnel("#small-steep-fnl").addSubOption(spoutSelector())
			)
		);

	var s6Option = makeMachine("#s6").addSubOption(
			makeWeighHopper("#stwh").addSubOption(
				makeDischargeFunnel("#discharge-cht-free").addSubOption(freeChuteOptions())
			),
			makeWeighHopper("#lrgwh").addSubOption(
				makeDischargeFunnel("#discharge-cht-free").addSubOption(freeChuteOptions())
			)
		);

	var s7Option = makeMachine("#s7").addSubOption(
			makeWeighHopper("#stwh2").addSubOption(
				makeDischargeFunnel("#small-dl-fnl").addSubOption(spoutSelector())
			),
			makeWeighHopper("#lrgwh2").addSubOption(
				makeDischargeFunnel("#large-dl-fnl").addSubOption(spoutSelector())
			)
		);

	// Create accessories along with the machines they are applicable to
	makeAccessory("#divided-supply-hopper", s7Option);

	weighHopperStep.hideAll();
	dischargeFunnelStep.hideAll();
	console.log(optionLookup);
	// Prepare

	/*
	* Document ready JS
	*/

	// Hide fallback content, add and delete button
	$('#field-name-discharge-funnel .large, .field-name-dimensions li, #step-2, #step-3, #step-4, #step-5, #step-6, #hidden-accessories-page, .container-shape-images > *, #btnAdd, #btnDel, .calculate, .spout-calculation, .field-spout .instructions p, #emailQuote, .field-spout .warning, #sending').hide();
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

		for (var key in machine) {
			if (key !== "spouts" && key !== "accessories") {
				price += parseFloat(machine[key].price);
				if (machine[key].priceSupplement) {
					price += parseFloat(machine[key].priceSupplement);
				}
			}
			else {
				for (var id in machine[key]) {
					price += parseFloat(machine[key][id].price);
				}
			}
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
		$('#pag-navigation a[data=' + stepID + ']').addClass('active');

		$('.step-container').hide();
		stepContainer.show();

		if (stepID === "step-6") {
			showValues();
		}

		$('#thankYouMessage').remove();
	}

	// Action for 'prev' & 'next' buttons
	$('.step-pager .button').click(function() {
		console.log("Previous / Next Button Clicked");

		// Determine the next step ID
		var $stepContainer = $(this).closest('.step-container');
		
		// We need to handle skipping steps with invisible tabs
		var switchingToID;

		var iteratorName; // Checkout this hack!
		if ($(this).is('.next')) {
			iteratorName = "next";
		}
		else {
			iteratorName = "prev";
		}

		while(true) {
			// This bit lets us do this without having to ask "is next" every time
			$stepContainer = $stepContainer[iteratorName]();
			switchingToID = $stepContainer.attr('id');

			// Check to see that the tab for the step is visible
			if ($("#pag-navigation a[data='" + switchingToID + "']:visible").length > 0) {
				break;
			}
			// Otherwise we keep going
		}

		// Apply the switch to the ID
		switchToStep(switchingToID);
	});

	// Action for left-hand step tabs
	$('#pag-navigation a').click(function() {
		var stepID = $(this).attr('data');
		switchToStep(stepID);
	});


	// Display Base Price as title on the front page and Price as Configured on every other page
	function changeCostContainerText() {
		var costContainerText = $('#cost-container .title').text(); 
		if (costContainerText !== 'Price as Configured:') {
			$('#cost-container .title').text('Price as Configured:');
		}
	}

    /*
     * Pages 1 - 4 selection actions
     */

	$fieldContainer.on('change', 'input[type=radio], input[type=checkbox]', function(e) {
		// Get the machine option that has a selected parent that has this ID
		var input = $(this);

		fieldContainerID = input.closest($fieldContainer).attr('id')

		// This is the old spout code and I see no reason to mess with it
		if (fieldContainerID === 'field-name-spout') {
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
		else {
			var id = this.id;
			console.log("Clicked on: " + id);

			var list = optionLookup[id];
			var clickedOption = null;
			for (var i = 0; i < list.length; i++) {
				if (list[i].parent === undefined || list[i].parent.isSelected()) {
					clickedOption = list[i];
					break;
				}
			}

			if (clickedOption != null) {
				if (!clickedOption.isSelected()) {
					clickedOption.select();
				}
				else if (clickedOption.step === accessoryStep) {
					clickedOption.deselect();
				}
			}
			else {
				console.log("Did not find option");
			}
		}
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

			var spout = spoutObjectForSpoutWrapperElement($spoutContainer.closest(".spout-wrapper"));
			machine.spouts[spout.id] = spout;
			calculateTotalPrice();

			// Show delete button
			$btnDel.show().prop('disabled', false);
			// Adjust the grand total
			// Show the spout image
			if ($spoutImage.hasClass('hidden')) {
				$spoutImage.removeClass('hidden');
				$machineImage.removeClass('no-spout');
				$machineImage.addClass('spout');
			}
		});
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
			name : "Spout",
			description : spoutWrapper.find(".spout-size").text(),
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

	$('#btnClose,#btnContinue').click(function() {
		$(this).closest('.step-container').hide();
	});
	
	/*
	 *  Display, Email and Print Summary
	 */
	
	// Retrieve form values for display on summary
	function showValues() {
		console.log("Showing values");
		// Create the machine type, weight hopper and discharge funnel rows for the summary table
		var resultsHTML = '';

		// Standard Machine Options
		for (var key in machine) {

			if (key !== "spouts" && key !== "accessories") {
				var piece = machine[key];

				resultsHTML += displayPiece(piece);
			}
		}
		// Display Spouts
		for (var spoutKey in machine["spouts"]) {
			var spout = machine["spouts"][spoutKey];

			resultsHTML += '<tr><th>' + spout.name + '</th>';
			resultsHTML += '<td>' + spout.description + ' inch</td>';
			resultsHTML += '<td>$' + spout.price + '</td></tr>';
		}

		// Display Accesssories
		for (var accessoryKey in machine["accessories"]) {
			resultsHTML += displayPiece(machine["accessories"][accessoryKey]);
		}

		// Create the total row for the summary table
		resultsHTML += '<tr class="total" style="text-align:right;border-top:1px solid #0c4b81;"><td>&nbsp;</td><th>Total:</th><td>$' + $("#cost-container .amount").text() + '</td></tr>';
		// Empty the current summary table and add the new rows in
		$('#results').empty().append(resultsHTML);
		// Stripe the results table
		$('#results tr').filter(':even').addClass('even').css("background-color", "#EBFFEA");
		return resultsHTML;
	}

	function displayPiece(piece) {
		var result = "";
		result += '<tr><th>';
		result += piece.name;
		if (piece.type) {
			result += " " + piece.type;
		}
		result += '</th>';

		// Description
		result += '<td>' + piece.description;
		if (piece.descriptionSupplement) {
			result += " " + piece.descriptionSupplement;
		}
		result += '</td>';

		// Price
		result += '<td>';
		if (parseFloat(piece.price) > 0) {
			result += "$" + piece.price;
		}
		else {
			result += "Included";
		}
		
		if (piece.priceSupplement) {
			result += " + $" + piece.priceSupplement;
		}
		result += '</td></tr>'
		return result;
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
		quoteText = encodeURIComponent(summaryPlainText());
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

	function summaryPlainText() {
		// Create the machine type, weight hopper and discharge funnel rows for the summary table
		var result = '';

		// Standard Machine Options
		for (var key in machine) {

			if (key !== "spouts" && key !== "accessories") {
				var piece = machine[key];

				result += displayPlainTextPiece(piece);
			}
		}
		// Display Spouts
		for (var spoutKey in machine["spouts"]) {
			var spout = machine["spouts"][spoutKey];

			result += spout.name + ' - ';
			result += "$" + spout.price + "\r";
			result += spout.description + " inch\r\r";
		}

		// Display Accesssories
		for (var accessoryKey in machine["accessories"]) {
			result += displayPlainTextPiece(machine["accessories"][accessoryKey]);
		}

		// Create the total row for the summary table
		result += '\rTotal: $' + $("#cost-container .amount").text();
		return result;
	}

	function displayPlainTextPiece(piece) {
		var result = "";
		result += piece.name;
		if (piece.type) {
			result += " " + piece.type;
		}
		result += ' - ';

		// Price
		if (parseFloat(piece.price) > 0) {
			result += "$" + piece.price;
		}
		else {
			result += "Included";
		}
		
		if (piece.priceSupplement) {
			result += " + $" + piece.priceSupplement;
		}

		result += "\r";

		// Description
		result += piece.description;
		if (piece.descriptionSupplement) {
			result += " " + piece.descriptionSupplement;
		}

		result += '\r\r';
		return result;
	}

});
