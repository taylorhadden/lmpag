<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js">
	<!--<![endif]-->

	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title>Logical Machines Quote Generator</title>
		<meta name="description" content="Scoop no more with Logical Machines automatic weigh and fill machines. Small to medium sized companies save time and money with our automated filling machines">
		<meta name="viewport" content="width=device-width">

		<!-- Place favicon.ico and apple-touch-icon.png in the root directory -->

		<link rel="stylesheet" href="css/lm-container.css">
		<link rel="stylesheet" href="css/normalize.css">
		<link rel="stylesheet" href="css/main.css">
		<link rel="stylesheet" href="css/forms.css">
		<script src="js/vendor/modernizr-2.6.2.min.js"></script>
		<script type="text/javascript" src="js/ahah.js" ></script>

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>

<script type="text/javascript">
	// Replace non-js iframe (small, with scrollbars) with js one (larger, no-scroll), if js is running
	$(document).ready( function() {
	//	$('#frame-container').html('<iframe id="quote-generator" src="http://lmpag.spirelightserver.com/quote-generator.php" width="785" height="1128" frameborder="no" scrolling="no"></iframe>');
		//$('#frame-container').html('<iframe id="quote-generator" src="quote-generator.php" width="785" height="1500" frameborder="no" scrolling="no"></iframe>');
	});
</script>
	</head>

	<body>
		<h1>Test Version</h1>
		<div id="PageDiv">
			<header id="header" class="clearfix">
				<div id="LMLogo1">
					<a href="index.html"><img src="img/lmlogo1.jpeg" width=258 height=96 alt="LMLogo1" style="float:left"></a>
		
	</div>
				<div id="h1-header">
					<h1 class="f-lp"><span class="style8">Logical Machines
						<br />
						Quote Generator</span></h1>
				</div>
				<div id="scoop15a">
					<img src="img/scoop15a.jpeg" width=105 height=118 alt="scoop15a" style="float:left">
				</div>
			</header>

			<div id="frame-container">
				<?php include 'quote-generator.php' ?>
				<!--<iframe id="quote-generator" src="quote-generator.php" width="785" height="600" frameborder="no" horizontalscrolling="no" verticalscrolling="yes"></iframe>-->
			</div>
		</div><!-- id="PageDiv" end -->


		<!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
		<script>
            var _gaq = [['_setAccount', 'UA-XXXXX-X'], ['_trackPageview']];
            ( function(d, t) {
                    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
                    g.src = ('https:' == location.protocol ? '//ssl' : '//www') + '.google-analytics.com/ga.js';
                    s.parentNode.insertBefore(g, s)
                }(document, 'script'));
		</script>
	</body>
</html>
