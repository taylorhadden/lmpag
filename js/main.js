$(document)
		.ready(
				function() {
					var addSpoutButton = '<input type="button" id="btnAdd" value="add another spout" />';
					var delSpoutButton = '<input type="button" id="btnDel" value="remove spout" />';
					var spoutWidthField = '<label for="spout-2-width-inches">Width in inches</label><input type="text" id="spout-2-width-inches" class="required  number" name="width-inches" />';
					var spoutHeightField = '<label for="spout-2-height-inches">Height in inches</label><input type="text" id="spout-2-height-inches" class="required  number" name="height-inches" />';
					var spoutDiameterField = '<label for="spout-2-diameter-inches">Diameter in inches</label><input type="text" id="spout-2-diameter-inches" class="required  number" name="height-inches" />';
					$(
							'.clonedInput:not(:first-child), #spout-1-dimensions > *,#js-warning')
							.remove();

					$('#edit-field-spout').append(addSpoutButton);

					$('input.spout-type')
							.click(
									function() {
										if ($(this).val() == 'flag-bag') {
											$('#spout-1-dimensions > *')
													.remove();
											$('#spout-1-dimensions').append(
													spoutWidthField);
										} else if ($(this).val() == '4-sided-bag') {
											$('#spout-1-dimensions > *')
													.remove();
											$('#spout-1-dimensions').append(
													spoutWidthField
															+ spoutHeightField);
										} else {
											$('#spout-1-dimensions > *')
													.remove();
											$('#spout-1-dimensions').append(
													spoutDiameterField);
										}
										;
									});

					$('#btnAdd').click(
							function() {
								var num = $('.clonedInput').length; // how many
																	// "duplicatable"
																	// input
																	// fields we
																	// currently
																	// have
								var newNum = new Number(num + 1); // the
																	// numeric
																	// ID of the
																	// new input
																	// field
																	// being
																	// added
								var newSpoutID = 'spout-' + newNum;
								// create the new element via clone(), and
								// manipulate it's ID using newNum value
								var newElem = $('#spout-' + num).clone().attr(
										'id', newSpoutID);

								// manipulate the name/id values of the input
								// inside the new element
								newElem.children(':first').attr('id',
										newSpoutID).attr('name',
												newSpoutID);


								// insert the new element after the last
								// "duplicatable" input field
								$('#spout-' + num).after(newElem);

								// enable the "remove" button
								$('#btnDel').attr('disabled', '');

								// business rule: you can only add 5 names
								/*
								 * if (newNum == 5)
								 * $('#btnAdd').attr('disabled','disabled');
								 */
							});

					$('#btnDel').click(function() {
						var num = $('.clonedInput').length; // how many
															// "duplicatable"
															// input fields we
															// currently have
						$('#spout-' + num).remove(); // remove the last
														// element

						// enable the "add" button
						$('#btnAdd').attr('disabled', '');

						// if only one element remains, disable the "remove"
						// button
						if (num - 1 == 1)
							$('#btnDel').attr('disabled', 'disabled');
					});

					$('#btnDel').attr('disabled', 'disabled');
				});
