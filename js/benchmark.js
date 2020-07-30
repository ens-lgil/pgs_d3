var svg_id = 'pgs_chart';
var file_name = 'PGS_benchmark';
var chart_colours = ["#367DB7", "#4CAE49", "#974DA2", "#FF7F00", '#E50000'];

class PGSBenchmark {

  constructor(chart_data,width,height) {

    // SVG space
    this.svg = d3.select('svg').attr('width', width).attr('height', height);

    this.margin = {top: 20, right: 100, bottom: 60, left: 60},
        this.chartWidth = width - this.margin.left - this.margin.right,
        this.chartHeight = height - this.margin.top - this.margin.bottom;
    this.g = this.svg.append('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.width = width;
    this.height = height;

    this.chart_data = chart_data;

    this.cohort = $('input[name="cohort"]:checked').val();

    this.metric = $("#benchmark_metric_select option:selected").val();

    this.selected_data = chart_data["data"][this.cohort][this.metric];

    // X categories and groups
    this.categoriesNames = chart_data.pgs_ids[this.cohort];
    this.groupNames = chart_data.ancestries[this.cohort];
    this.set_groupNames();
    this.set_groupNames_colours();


    // Draw chart
    this.draw_chart();
  }


  // Draw the different components of the chart
  draw_chart() {

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    console.log(this.categoriesNames);
    console.log(this.groupNames);

    var min_value = this.get_min_value();
    var max_value = this.get_max_value();

    // The scale spacing the groups:
    this.x0 = d3.scaleBand()
        .domain(this.categoriesNames)
        .rangeRound([0, this.chartWidth])
        .paddingInner(0.05);

    // The scale for spacing each group's bar:
    this.x1 = d3.scaleBand()
        //.padding(0.05);
        .domain(this.groupNames)
        .rangeRound([0, this.x0.bandwidth()])
        .padding(1);

    this.y = d3.scaleLinear()
        .domain([min_value, max_value])
        .rangeRound([this.chartHeight, 0]);

    this.z = d3.scaleOrdinal()
        .domain(this.groupNames)
        .range(this.get_groupNames_colours());


    /* Drawing/updating chart */

    // Draw Axes
    this.addAxes();

    // Draw threshold/horizontal line
    this.addHorizontalLine(min_value)

    // Load data in the chart
    this.addData();

    // Load legend in the chart
    this.addLegend();
  }


  // Draw the chart axes
  addAxes() {
    // Axes
    var xAxis = this.g.append('g')
      .attr("class", "xaxis")
      .attr('transform', 'translate(0,' + this.chartHeight + ')')
      .call( d3.axisBottom(this.x0) );
    var yAxis = this.g.append('g')
      .attr("class", "yaxis")
      .call( d3.axisLeft(this.y) );


    // X axis label
    this.svg.append("text")
      .attr("class", "x_label")
      .attr("transform", "translate(" + (this.chartWidth/2) + " ," + (this.height - 20) + ")")
      .style("text-anchor", "middle")
      .text("PGS Catalog Score ID");

    // Y axis label
    this.svg.append("text")
        .attr("class", "y_label")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", 0 - (this.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(this.metric);

  }


  // Draw the horizontal line (threshold)
  addHorizontalLine(min_value) {
    var y_coord = this.chartHeight/2;
    if (min_value < 0) {
      y_coord = this.y(0)
    }
    this.g.append("line")
      .attr("class", "hline")
      .attr("stroke", 'black')
      .attr("stroke-width", 1)
      .style("stroke-dasharray", ("6, 6"))
      .attr('x1', 0)
      .attr('x2', this.chartWidth)
      .attr('y1', y_coord)
      .attr('y2', y_coord);
  }


  // Draw the chart content
  addData() {

    var selected_data = [];
    for (var i=0;i<this.selected_data.length;i++) {
      if (this.groupNames.indexOf(this.selected_data[i].grpName) != -1) {
        selected_data.push(this.selected_data[i]);
      }
    }

    var chart_content = this.g.append("g").attr('class', 'chart_content');

    // Use a different variable name to avoid issue within the d3 functions
    var obj = this;

    /* Lines */
    if ("eb" in selected_data[0]) {

      var lines = chart_content.selectAll('line.error')
        .data(selected_data);

      // Vertical line
      lines.enter().append('line')
        .attr('class', 'error')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.grpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.grpName); })
        .attr('x2', function(d) { return obj.x1(d.grpName); })
        .attr('y1', function(d) { return obj.y(d.et); })
        .attr('y2', function(d) { return obj.y(d.eb); });
      // Horizontal line - top
      lines.enter().append('line')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.grpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.grpName)-5; })
        .attr('x2', function(d) { return obj.x1(d.grpName)+5; })
        .attr('y1', function(d) { return obj.y(d.et); })
        .attr('y2', function(d) { return obj.y(d.et); });
      // Horizontal line - bottom
      lines.enter().append('line')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.grpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.grpName)-5; })
        .attr('x2', function(d) { return obj.x1(d.grpName)+5; })
        .attr('y1', function(d) { return obj.y(d.eb); })
        .attr('y2', function(d) { return obj.y(d.eb); });

      chart_content.selectAll('line.error')
        //.transition()
        .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; });
    }

    /* Points */
    var points = chart_content.selectAll('circle.point')
      .data(selected_data);

    points.enter()
      .append('circle')
      .attr('class', function(d) { return 'point '+d.grpName })
      .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
      .attr('r', 4)
      .attr("fill", function(d) { return obj.z(d.grpName); })
      .attr('cx', function(d) { return obj.x1(d.grpName); })
      .attr('cy', function(d) { return obj.y(d.y); });


    /* Rectangle area used by tooltip */
    if ("eb" in selected_data[0]) {
      this.has_lines = true;
      chart_content.selectAll('rect')
        .data(selected_data)
        .enter()
        .append('rect')
        .attr('class', function(d) { return 'rect '+d.grpName })
        .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
        .each(function(d,i){
          obj.addTooltip($(this), d);
        })
        .attr("x", function(d) { return obj.x1(d.grpName) - 6; })
        .attr("y", function(d) { return obj.y(d.et) - 1; })
        .attr("width", 12)
        .attr("height", function(d) { return obj.y(d.eb) - obj.y(d.et) + 2; })
        .attr("fill", "transparent");
    }
    else {
      this.has_lines = false;
      chart_content.selectAll('rect')
        .data(selected_data)
        .enter()
        .append('rect')
        .attr('class', function(d) { return 'rect '+d.grpName })
        .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
        .each(function(d,i){
          obj.addTooltip($(this), d);
        })
        .attr("x", function(d) { return obj.x1(d.grpName) - 3; })
        .attr("y", function(d) { return obj.y(d.y) - 3; })
        .attr("width", 10)
        .attr("height", function(d) { return 10; })
        .attr("fill", "transparent");
    }
  }


  // Draw the legend
  addLegend() {

    var text_x = 30;
    if (this.has_lines == true) {
      text_x = 40;
    }

    var legend = this.g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .attr("class", "chart_legend")
      .selectAll("g")
      .data(this.groupNames.slice())
      .enter().append("g")
      .attr("class", function(d) { return d; } )
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    if (this.has_lines == true) {
      legend.append("line")
        .attr("x1", this.chartWidth + 10)
        .attr("x2", this.chartWidth + 30)
        .attr("y1", 9.5)
        .attr("y2", 9.5)
        .attr("stroke", this.z)
        .attr("stroke-width", 2);
    }
    legend.append("circle")
      .attr("r", 4)
      .attr("cx", this.chartWidth + 20)
      .attr("cy", 9.5)
      .attr("fill", this.z);
    legend.append("text")
      .attr("x", this.chartWidth + text_x)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .attr("text-anchor", "start")
      .text(function(d) { return d; });
  }

  // Set the list of distinct groups (ancestry)
  set_groupNames() {
    var gp_list = [];
    $(".benchmark_ancestry_cb").each(function () {
      if ($(this).prop("checked"))  {
        gp_list.push($(this).val());
      }
    });
    this.groupNames = gp_list;
  }

  // Set the group colours
  set_groupNames_colours() {
    var gp_colours = {};
    for (var i=0; i<this.groupNames.length; i++) {
      var gp_name = this.groupNames[i];
      var colour = chart_colours[i];
      gp_colours[gp_name] = colour;
    }
    this.groupNames_colours = gp_colours;
  }

  // Get the group colours
  get_groupNames_colours() {
    var gp_colours = [];
    for (var i=0; i<this.groupNames.length; i++) {
      var gp_name = this.groupNames[i];
      gp_colours.push(this.groupNames_colours[gp_name]);
    }
    return gp_colours;
  }


  // This function updates the chart when an different cohort is selected
  update_cohort(){
    // Remove chart content + legend + XY axis + horizontal line
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();
    this.svg.selectAll('.xaxis').remove();
    this.svg.selectAll('.yaxis').remove();
    this.svg.selectAll('.x_label').remove();
    this.svg.selectAll('.y_label').remove();
    this.svg.selectAll('.hline').remove();

    this.cohort = $('input[name="cohort"]:checked').val();

    // Refresh the forms
    fill_ancestry_form(this.chart_data,this.cohort);
    fill_metric_form(this.chart_data,this.cohort);


    // Reset some of the variables
    this.metric = $("#benchmark_metric_select option:selected").val();
    this.selected_data = this.chart_data["data"][this.cohort][this.metric];

    // X categories and groups
    this.categoriesNames = this.chart_data.pgs_ids[this.cohort];
    this.groupNames = this.chart_data.ancestries[this.cohort];
    this.set_groupNames();
    this.set_groupNames_colours();

    // Redraw chart
    this.draw_chart();
  }


  // This function updates the chart when an ancestry is checked in or out
  update_ancestry(){
    // Reset the list of group names (Ancestry)
    this.set_groupNames();

    // Remove chart content + legend
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();

    this.x1.domain(this.groupNames).rangeRound([0, this.x0.bandwidth()]);
    // Load updated set of data to the chart
    this.addData();
    // Load updated legend on the chart
    this.addLegend();

    /*d3.selectAll(".benchmark_ancestry_cb").each(function(d){
      cb = d3.select(this);
      grp = cb.property("value");

      // If the box is check, I show the group
      if(cb.property("checked")){
        //console.log(grp+": checked");
        checked_gp_names.push(grp);
        svg.selectAll("."+grp).transition().duration(200).style("opacity", 1);
        svg.selectAll("."+grp).style("display", 'block');
      // Otherwise I hide it
      } else{
        svg.selectAll("."+grp).transition().duration(200).style("opacity", 0);
        svg.selectAll("."+grp).style("display", 'none');
      }

    });
    x1.domain(checked_gp_names).rangeRound([0, x0.bandwidth()]);*/
  }


  // This function updates the chart content and Y axis when an different metric is selected
  update_metric(){
    // Change the performance metric
    this.metric = $("#benchmark_metric_select option:selected").val();

    this.selected_data = this.chart_data["data"][this.cohort][this.metric];

    // Remove chart content + legend
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();

    // Redraw Y axis
    var min_value = this.get_min_value();
    var max_value = this.get_max_value();

    this.y = d3.scaleLinear()
        .domain([min_value, max_value])
        .rangeRound([this.chartHeight, 0]);

    this.svg.select(".yaxis")
      .transition().duration(800)
      .call( d3.axisLeft(this.y) );

    // Y axis label
    this.svg.selectAll('.y_label').remove();
    this.svg.append("text")
        .attr("class", "y_label")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", 0 - (this.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(this.metric);


    // Load updated set of data to the chart
    this.addData();
    // Load updated legend on the chart
    this.addLegend();
  }

  // Get min value of the selected dataset
  get_min_value(){
    var min_value = d3.min(this.selected_data, function(d) {
      if ("eb" in d) {
        return (d.eb);
      }
      else {
        return (d.y);
      }
    });
    if (min_value > 0) {
      min_value = min_value - ((min_value/100)*15);
    }
    else {
      min_value = min_value + ((min_value/100)*15);
    }
    return min_value;
  }

  // Get max value of the selected dataset
  get_max_value(){
    var max_value = d3.max(this.selected_data, function(d) {
      if ("et" in d) {
        return (d.et);
      }
      else {
        return (d.y);
      }
    });
    if (max_value > 0) {
      max_value = max_value + ((max_value/100)*10);
    }
    else {
      max_value = max_value - ((max_value/100)*10);
    }
    return max_value;
  }

  // Add tooltip on the chart elements
  addTooltip(elem, data) {
    var title = "<b>"+data.grpName + "</b>";
    if (data.et) {
      title += "<br/>Upper 95: <b>" + data.et + "</b><br/>Estimate: <b>" + data.y + "</b><br/>Lower 95: <b>" + data.eb+"</b>";
    }
    else {
      title += "<br/>Value: <b>" + data.y + "</b>";
    }
    elem.tooltip({
      'title': title,
      'placement': 'right',
      'html': true
    });
  }
}



/*
 * Export buttons events
 */
$( document ).ready(function() {

  $("#exportPDF").on("click", function() {

    console.log("Export PDF");
    let svg = new XMLSerializer().serializeToString(document.getElementById(svg_id));
    let canvas = document.createElement("canvas");
    let svgSize = $(svg)[0];
    // let svgSize = $(svg)[0].getBoundingClientRect();
    canvas.width = svgSize.width.baseVal.value;
    canvas.height = svgSize.height.baseVal.value;

    let ctx = canvas.getContext("2d");
    let doc = new jsPDF({
      orientation: 'l',
      unit: 'px'
    });
    let img = document.createElement("img");
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      doc.setFontSize(12);
      doc.text(5, 10, 'PGS Chart');
      doc.addImage(canvas.toDataURL("image/png"), 'PNG', 10, 10);
      doc.save(file_name+'.pdf');
    };
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svg));
  });


  $("#exportPNG").on("click", function() {
    console.log("Export PNG");
    svg = d3.select("#"+svg_id);
    var svgString = getSVGString(svg.node());
    svgString2Image( svgString, 2*width, 2*height, 'png');//, save ); // passes Blob and filesize String to the callback

    /*function save( dataBlob, filesize ){
      saveAs( dataBlob, 'PGS_benchmark.png' ); // FileSaver.js function
    }*/
  });

  $("#exportSVG").on("click", function() {
    console.log("Export SVG");
    var serializer = new XMLSerializer();
    var svgData = serializer.serializeToString(document.getElementById(svg_id));
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = file_name+'.svg';
    downloadLink.click();
  });

});



/*
 * Functions that handle actual exporting into PNG
 */
function getSVGString( svgNode ) {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  var cssStyleText = getCSSStyles( svgNode );
  appendCSS( cssStyleText, svgNode );

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

  return svgString;

  // Extract CSS styling
  function getCSSStyles( parentElement ) {
    var selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push( '#'+parentElement.id );
    for (var c = 0; c < parentElement.classList.length; c++) {
      if ( !contains('.'+parentElement.classList[c], selectorTextArr) ) {
        selectorTextArr.push( '.'+parentElement.classList[c] );
      }
    }

    // Add Children element Ids and Classes to the list
    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if ( !contains('#'+id, selectorTextArr) ) {
        selectorTextArr.push( '#'+id );
      }

      var classes = nodes[i].classList;
      for (var c = 0; c < classes.length; c++)
        if ( !contains('.'+classes[c], selectorTextArr) ) {
          selectorTextArr.push( '.'+classes[c] );
        }
    }

    // Extract CSS Rules
    var extractedCSSText = "";
    for (var i = 0; i < document.styleSheets.length; i++) {
      var s = document.styleSheets[i];
      try {
        if(!s.cssRules) continue;
      } catch( e ) {
        if(e.name !== 'SecurityError') throw e; // for Firefox
        continue;
      }

      var cssRules = s.cssRules;
      for (var r = 0; r < cssRules.length; r++) {
        if ( contains( cssRules[r].selectorText, selectorTextArr ) ) {
          extractedCSSText += cssRules[r].cssText;
        }
      }
    }

    return extractedCSSText;

    function contains(str,arr) {
      return arr.indexOf( str ) === -1 ? false : true;
    }
  }

  function appendCSS( cssText, element ) {
    var styleElement = document.createElement("style");
    styleElement.setAttribute("type","text/css");
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore( styleElement, refNode );
  }
}

function svgString2Image( svgString, width, height, format) {//, callback ) {

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  var image = new Image();
  image.onload = function() {
    context.clearRect ( 0, 0, width, height );
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob( function(blob) {
      saveAs( blob, file_name+'.'+format );
      //var filesize = Math.round( blob.length/1024 ) + ' KB';
      //if ( callback ) callback( blob, filesize );
    });
  };
  image.src = imgsrc;
}



/*
 * Functions to fill the forms:
 * Cohort, Ancestry, Metric
 */
function fill_cohort_form(data) {
  var default_cohort = '';
  var cohorts_html_rb = '';
  for (var i=0; i<data.cohorts.length;i++) {
    var id = 'cohort_'+i;
    var is_checked = '';
    var cohort = data.cohorts[i];
    if (i == 0) {
      is_checked = 'checked ';
      default_cohort = cohort;
    }
    cohorts_html_rb += '<div>'+
                       '  <input type="radio" '+is_checked+'id="'+id+'" name="cohort" value="'+cohort+'">'+
                       '  <label class="mb-0" for="'+id+'"> '+cohort+'</label>'+
                       '</div>';
  }
  $("#benchmark_cohort_list").append(cohorts_html_rb);
  return default_cohort;
}

function fill_ancestry_form(data, cohort) {
  $("#benchmark_ancestry_list").html('');
  // Ancestry
  var ancestry_html_cb = '';
  var ancestry_length = data.ancestries[cohort].length;
  for (var i=0; i<ancestry_length;i++) {
    id = 'gpName_'+i;
    var ancestry = data.ancestries[cohort][i];
    var is_disabled = '';
    if (ancestry_length == 1) {
      is_disabled = ' disabled';
    }
    ancestry_html_cb += '<div>'+
                        '  <input type="checkbox" class="benchmark_ancestry_cb" checked'+is_disabled+' value="'+ancestry+'" id="'+id+'">'+
                        '  <label class="mb-0" for="'+id+'"> '+ancestry+'</label>'+
                        '</div>';
  }
  $("#benchmark_ancestry_list").append(ancestry_html_cb);
}

function fill_metric_form(data, cohort) {
  $("#benchmark_metric_select").html('');
  metrics = Object.keys(data.data[cohort]);
  for (var i=0; i<metrics.length;i++) {
    metric = metrics[i];
    var option = new Option(metric, metric);
    $("#benchmark_metric_select").append(option);
  }
}
