var svg_id = 'pgs_chart';
var sep = '__';
var file_name = 'PGS_benchmark';
// X axis label
var chart_xaxis_label = 'PGS Catalog - Score ID';
// Colours to differenciate the ancestries
var chart_colours = ["#367DB7", "#4CAE49", "#974DA2", "#FF7F00", '#E50000'];
// Point symbols/shapes to differenciate the cohorts data
var chart_shapes = [ d3.symbolCircle, d3.symbolTriangle, d3.symbolDiamond, d3.symbolSquare, d3.symbolCross];
// Horizontal lines - threshold
var threshold = { 'HR': 1, 'OR': 1, 'C-index': 0.5, 'AUROC': 0.5, 'DeltaC': 0, 'deltaAUROC': 0};

/*
 * Main class to build the 'PGS Benchmark' chart
 */
class PGSBenchmark {

  constructor(chart_data,width,height) {
    // SVG space
    this.svg = d3.select('svg').attr('width', width).attr('height', height);

    this.margin = {top: 20, right: 130, bottom: 60, left: 60},
        this.chartWidth = width - this.margin.left - this.margin.right,
        this.chartHeight = height - this.margin.top - this.margin.bottom;
    this.g = this.svg.append('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.width = width;
    this.height = height;

    this.chart_data = chart_data;

    this.cohorts = set_cohorts_list();
    this.set_cohort_data_shapes();

    // Fetch the selected performance metric
    this.set_metric();
    // Fetch the selected sex type
    this.set_sex_type();

    // Get the data corresponding to the filters selection
    this.set_selected_data();

    // X axis categories
    this.set_category_names();

    // Groups (ancestries)
    this.groupNames = set_groupNames();
    this.set_groupNames_colours();

    // X axis groups (ancestries)
    this.set_cohortGroupNames();
    this.set_cohortGroupNames_colours();

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
    console.log(this.cohortGroupNames);

    // Setup the min/max for the Y scale
    this.get_min_max_values();

    // The scale spacing the groups:
    this.x0 = d3.scaleBand()
        .domain(this.categoriesNames)
        .rangeRound([0, this.chartWidth])
        .paddingInner(0.05);

    // The scale for spacing each group's bar:
    this.x1 = d3.scaleBand()
        //.padding(0.05);
        .domain(this.cohortGroupNames)
        .rangeRound([0, this.x0.bandwidth()])
        .padding(1);

    this.y = d3.scaleLinear()
        .domain([this.min_value, this.max_value])
        .rangeRound([this.chartHeight, 0]);

    this.z = d3.scaleOrdinal()
        .domain(this.cohortGroupNames)
        .range(this.get_cohortGroupNames_colours());

    /* Drawing/updating chart */

    // Draw Axes
    this.addAxes();

    // Draw threshold/horizontal line
    this.addHorizontalLine()

    // Load data in the chart
    this.addData();

    // Load legend in the chart
    this.addLegend();
  }


  // Draw the chart axes
  addAxes() {
    // X axis
    var xAxis = this.g.append('g')
      .attr("class", "xaxis")
      .attr('transform', 'translate(0,' + this.chartHeight + ')')
      .call( d3.axisBottom(this.x0) );
    // X axis - label
    this.svg.append("text")
      .attr("class", "x_label")
      .attr("transform", "translate(" + (this.chartWidth/2) + " ," + (this.height - 20) + ")")
      .style("text-anchor", "middle")
      .text(chart_xaxis_label);

    // Y axis
    var yAxis = this.g.append('g')
      .attr("class", "yaxis")
      .call( d3.axisLeft(this.y) );
    // Y axis - label
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
  addHorizontalLine() {
    var y_val = 0;
    if (threshold[this.metric]) {
      y_val = threshold[this.metric];
    }
    console.log("Y val ("+this.metric+"): "+y_val);
    //var y_coord = this.chartHeight/2;
    if (y_val > this.min_value && y_val < this.max_value) {
      var y_coord = this.y(y_val)
      this.g.append("line")
        .attr("class", "chart_hline")
        .attr("stroke", 'black')
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("6, 6"))
        .attr('x1', 0)
        .attr('x2', this.chartWidth)
        .attr('y1', y_coord)
        .attr('y2', y_coord);
    }
  }


  // Draw the chart content
  addData() {
    // Chart container
    var chart_content = this.g.append("g").attr('class', 'chart_content');

    // Use a different variable name to avoid issue within the d3 functions
    var obj = this;

    // Cohorts
    var global_selected_data = [];
    var cohorts = Object.keys(this.selected_data);
    for (var i=0;i<cohorts.length;i++) {
      var cohort = cohorts[i];
      for (var j=0;j<this.selected_data[cohort].length;j++) {
        if (this.groupNames.indexOf(this.selected_data[cohort][j].grpName) != -1) {
          var entry = this.selected_data[cohort][j];
          entry['cohortGrpName'] = cohort+sep+entry.grpName;
          global_selected_data.push(entry);
        }
      }
    }

    /* Lines */
    if ("eb" in global_selected_data[0]) {

      var lines = chart_content.selectAll('line.error')
        .data(global_selected_data);

      // Vertical line
      lines.enter().append('line')
        .attr('class', 'error')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.cohortGrpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.cohortGrpName); })
        .attr('x2', function(d) { return obj.x1(d.cohortGrpName); })
        .attr('y1', function(d) { return obj.y(d.et); })
        .attr('y2', function(d) { return obj.y(d.eb); });
      // Horizontal line - top
      lines.enter().append('line')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.cohortGrpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.cohortGrpName)-5; })
        .attr('x2', function(d) { return obj.x1(d.cohortGrpName)+5; })
        .attr('y1', function(d) { return obj.y(d.et); })
        .attr('y2', function(d) { return obj.y(d.et); });
      // Horizontal line - bottom
      lines.enter().append('line')
        .attr('class', function(d) { return 'error '+d.grpName })
        .attr("stroke", function(d) { return obj.z(d.cohortGrpName); })
        .attr("stroke-width", 2)
      //.merge(lines)
        .attr('x1', function(d) { return obj.x1(d.cohortGrpName)-5; })
        .attr('x2', function(d) { return obj.x1(d.cohortGrpName)+5; })
        .attr('y1', function(d) { return obj.y(d.eb); })
        .attr('y2', function(d) { return obj.y(d.eb); });

      chart_content.selectAll('line.error')
        //.transition()
        .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; });
    }

    /* Data points */
    for (var i=0;i<cohorts.length;i++) {
      var cohort = cohorts[i];
      var selected_data = [];
      for (var j=0;j<this.selected_data[cohort].length;j++) {
        if (this.groupNames.indexOf(this.selected_data[cohort][j].grpName) != -1) {
          selected_data.push(this.selected_data[cohort][j]);
        }
      }

      // Data points - each cohort has its point shape
      var points = chart_content.selectAll('data.point')
        .data(selected_data);
      points.enter()
        .append('path')
        .attr("transform",function(d) { return "translate(" + (obj.x0(d.pgs) + obj.x1(cohort+sep+d.grpName)) +","+ obj.y(d.y)+")"; })
        .attr("fill", function(d) { return obj.z(cohort+sep+d.grpName); })
        .attr('d', obj.get_point_path(obj.cohort_data_shapes[cohort]));
    }


    /* Rectangle area used by tooltip */
      if ("eb" in global_selected_data[0]) {
        this.has_lines = true;
        chart_content.selectAll('rect')
          .data(global_selected_data)
          .enter()
          .append('rect')
          .attr('class', function(d) { return 'rect tooltip_area '+d.grpName })
          .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
          .each(function(d,i){
            obj.addTooltip($(this), d);
          })
          .attr("x", function(d) { return obj.x1(d.cohortGrpName) - 6; })
          .attr("y", function(d) { return obj.y(d.et) - 1; })
          .attr("width", 12)
          .attr("height", function(d) { return obj.y(d.eb) - obj.y(d.et) + 2; })
          .attr("fill", "transparent");
      }
      else {
        this.has_lines = false;
        chart_content.selectAll('rect')
          .data(global_selected_data)
          .enter()
          .append('rect')
          .attr('class', function(d) { return 'rect tooltip_area '+d.grpName })
          .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
          .each(function(d,i){
            obj.addTooltip($(this), d);
          })
          .attr("x", function(d) { return obj.x1(d.cohortGrpName) - 3; })
          .attr("y", function(d) { return obj.y(d.y) - 3; })
          .attr("width", 10)
          .attr("height", function(d) { return 10; })
          .attr("fill", "transparent");
      }
  }


  // Draw the legend
  addLegend() {
    var obj = this;

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
      .data(this.cohortGroupNames.slice())
      .enter().append("g")
      .attr("class", function(d) { return d; } )
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    // Legend with line
    if (this.has_lines == true) {
      legend.append("line")
        .attr("x1", this.chartWidth + 10)
        .attr("x2", this.chartWidth + 30)
        .attr("y1", 9.5)
        .attr("y2", 9.5)
        .attr("stroke", this.z)
        .attr("stroke-width", 2);
    }
    // Legend point with its corresponding shape
    legend.append('path')
      .attr("transform", function(d, i) { return "translate(" + (obj.chartWidth + 20) +",9.5)"; })
      .attr("fill", this.z)
      .attr('d', obj.get_point_path(function(d) { return obj.cohortGroupNames_data_shapes[d]; }));
      //.attr('d', d3.symbol().type(function(d) { return obj.cohortGroupNames_data_shapes[d]; }).size(60));

    legend.append("text")
      .attr("x", this.chartWidth + text_x)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .attr("text-anchor", "start")
      .text(function(d) {
        var text = d.split(sep);
        return text[1]+" ("+text[0]+")";
      });
  }



  // Get the cohort groups
  set_cohortGroupNames() {
    var cohort_gp_list = [];
    var cohorts = Object.keys(this.selected_data);
    for (var i=0;i<cohorts.length;i++) {
      var cohort = cohorts[i];
      var ancestry_list = this.chart_data.ancestries[cohort];
      // Ancestries
      for (var j=0; j<ancestry_list.length;j++) {
        var ancestry = ancestry_list[j];
        if (this.groupNames.includes(ancestry)) {
          cohort_gp_list.push(cohort+sep+ancestry);
        }
      }
    }
    this.cohortGroupNames = cohort_gp_list;
    //this.set_cohortGroupNames_colours();
    this.set_cohortGroupNames_data_shapes();
  }


  /* Assign data point shapes ('path' in D3) */

  // Get D3 data point path
  get_point_path(symbol){
    return d3.symbol().type(symbol).size(60);
  }
  // Define a data point shape for each cohort
  set_cohort_data_shapes() {
    this.cohort_data_shapes = {};
    for (var i=0; i<this.cohorts.length; i++) {
      this.cohort_data_shapes[this.cohorts[i]] = chart_shapes[i];
    }
  }
  // Define a data point shape for each cohort group (ancestry)
  set_cohortGroupNames_data_shapes() {
    this.cohortGroupNames_data_shapes = {};
    for (var i=0; i<this.cohortGroupNames.length; i++) {
      var cohortGroupName = this.cohortGroupNames[i]
      var cohort = cohortGroupName.split(sep)[0];
      this.cohortGroupNames_data_shapes[cohortGroupName] = this.cohort_data_shapes[cohort];
    }
  }


  /* Assign the group/ancestry colours */

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
  // Set the cohort group colours
  set_cohortGroupNames_colours() {
    this.cohortGroupNames_colours = {};
    var gp_colours = {};
    for (var i=0; i<this.cohortGroupNames.length; i++) {
      var cohort_gp_name = this.cohortGroupNames[i];
      var gp_name = cohort_gp_name.split(sep)[1];
      this.cohortGroupNames_colours[cohort_gp_name] = this.groupNames_colours[gp_name];
    }
  }
  // Get the cohort group colours
  get_cohortGroupNames_colours() {
    var gp_colours = [];
    for (var i=0; i<this.cohortGroupNames.length; i++) {
      var gp_name = this.cohortGroupNames[i];
      gp_colours.push(this.cohortGroupNames_colours[gp_name]);
    }
    return gp_colours;
  }


  // Fetch the data of the selected cohorts
  set_selected_data() {
    this.selected_data = {};
    for (var i=0; i<this.cohorts.length; i++) {
      var cohort = this.cohorts[i];
      var metrics = Object.keys(this.chart_data["data"][cohort]);
      if (metrics.includes(this.metric)) {
        var sexes = Object.keys(this.chart_data["data"][cohort][this.metric]);
        if (sexes.includes(this.sex_type)) {
          var data = this.chart_data["data"][cohort][this.metric][this.sex_type];
          this.selected_data[cohort] = data;
        }
      }
    }
  }

  // Define the categories for the X axis
  set_category_names() {
    var cat_list = [];
    // Cohorts
    var cohorts = Object.keys(this.selected_data);
    for (var i=0;i<cohorts.length;i++) {
      var cohort = cohorts[i];
      var categories = this.chart_data.pgs_ids[cohort];
      // Categories (PGS IDs)
      for (var j=0; j<categories.length; j++) {
        if (!cat_list.includes(categories[j])) {
          cat_list.push(categories[j]);
        }
      }
    }
    cat_list.sort();
    this.categoriesNames = cat_list;
  }

  // Fetch the selected performance metric
  set_metric() {
    this.metric = $("#benchmark_metric_select option:selected").val();
  }

  // Fetch the selected sex type
  set_sex_type() {
    this.sex_type = $('input[name="benchmark_sex_type"]:checked').val();
  }


  // This function updates the chart when an different cohort is selected
  update_cohort() {
    // Fetch selection of cohorts
    this.cohorts = set_cohorts_list();

    // Remove chart content + legend + XY axis + horizontal line
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();
    this.svg.selectAll('.chart_hline').remove();
    this.svg.selectAll('.xaxis').remove();
    this.svg.selectAll('.yaxis').remove();
    this.svg.selectAll('.x_label').remove();
    this.svg.selectAll('.y_label').remove();

    // Refresh the forms
    fill_ancestry_form(this.chart_data, this.cohorts);
    fill_metric_form(this.chart_data, this.cohorts);
    fill_sex_form(this.chart_data, this.cohorts);

    // Reset some of the variables
    this.set_metric();
    this.set_sex_type();
    this.set_selected_data();

    // X axis categories
    this.set_category_names();

    // Groups (ancestries)
    this.groupNames = set_groupNames();

    // X axis groups (ancestries)
    this.set_cohortGroupNames();

    // Redraw chart
    this.draw_chart();
  }


  // This function updates the chart when an ancestry is checked in or out
  update_ancestry() {
    // Reset the list of group names (Ancestry)
    this.groupNames = set_groupNames();
    this.set_cohortGroupNames();

    // Remove chart content + legend
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();

    // Reset some of the coordinates
    this.x1.domain(this.cohortGroupNames).rangeRound([0, this.x0.bandwidth()]);
    this.z = d3.scaleOrdinal()
        .domain(this.cohortGroupNames)
        .range(this.get_cohortGroupNames_colours());

    // Load updated set of data to the chart
    this.addData();
    // Load updated legend on the chart
    this.addLegend();
  }


  // This function updates the chart content and Y axis when a different metric is selected
  update_metric() {
    // Change the selected performance metric
    this.set_metric();

    // Change the sex type
    fill_sex_form(this.chart_data, this.cohorts);
    this.set_sex_type();

    this.set_selected_data();
    this.set_cohortGroupNames();

    // Remove chart content + legend
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();
    this.svg.selectAll('.chart_hline').remove();

    // Redraw Y axis
    // Setup the min/max for the Y scale
    this.get_min_max_values();

    this.y = d3.scaleLinear()
        .domain([this.min_value, this.max_value])
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


    // Redraw threshold/horizontal line
    this.addHorizontalLine();
    // Load updated set of data to the chart
    this.addData();
    // Load updated legend on the chart
    this.addLegend();
  }


  // This function updates the chart content and Y axis when a different sex is selected
  update_sex() {
    // Change the selected sex type
    this.set_sex_type();

    this.set_selected_data();
    this.set_cohortGroupNames();

    // Remove chart content + legend
    this.svg.selectAll('.chart_content').remove();
    this.svg.selectAll('.chart_legend').remove();
    this.svg.selectAll('.chart_hline').remove();

    // Redraw Y axis
    // Setup the min/max for the Y scale
    this.get_min_max_values();

    this.y = d3.scaleLinear()
        .domain([this.min_value, this.max_value])
        .rangeRound([this.chartHeight, 0]);

    this.svg.select(".yaxis")
      .transition().duration(800)
      .call( d3.axisLeft(this.y) );

    // Redraw threshold/horizontal line
    this.addHorizontalLine();
    // Load updated set of data to the chart
    this.addData();
    // Load updated legend on the chart
    this.addLegend();
  }


  // Get min and max values of the selected dataset
  get_min_max_values() {
    var min_value = '';
    var max_value = '';

    var cohorts = Object.keys(this.selected_data);
    for (var i=0;i<cohorts.length;i++) {
      var cohort = cohorts[i];

      // Min value
      var cohort_min_value = d3.min(this.selected_data[cohort], function(d) {
        if ("eb" in d) {
          return (d.eb);
        }
        else {
          return (d.y);
        }
      });
      if (min_value == '' || min_value > cohort_min_value) {
        min_value = cohort_min_value;
      }

      // Max value
      var cohort_max_value = d3.max(this.selected_data[cohort], function(d) {
        if ("et" in d) {
          return (d.et);
        }
        else {
          return (d.y);
        }
      });
      if (max_value == '' || max_value < cohort_max_value) {
        max_value = cohort_max_value;
      }
    }
    var interval = Math.abs(max_value - min_value);
    var interval_extra = (interval/100)*5;
    if (interval_extra == 0) {
      interval_extra = (max_value/100)*5;
    }

    // Min value
    this.min_value = min_value - interval_extra;
    // Max value
    this.max_value = max_value + interval_extra;
  }


  // Add tooltip on the chart elements
  addTooltip(elem, data) {
    var title = '<div class="tooltip_title"><b>'+data.grpName + '</b> ('+data.cohortGrpName.split(sep)[0]+')</div>';
    if (data.et) {
      title += "<div>Upper 95: <b>" + data.et + "</b></div><div>Estimate: <b>" + data.y + "</b></div><div>Lower 95: <b>" + data.eb+"</b></div>";
    }
    else {
      title += "<div>Value: <b>" + data.y + "</b></div>";
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
    let doc = new jsPDF({ orientation: 'l', unit: 'px' });
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
      for (var c = 0; c < classes.length; c++) {
        if ( !contains('.'+classes[c], selectorTextArr) ) {
          selectorTextArr.push( '.'+classes[c] );
        }
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
 * Functions to fill and fetch the forms:
 * Cohort, Ancestry, Metric
 */

// Build "Cohort" form
function fill_cohort_form(data) {
  $("#benchmark_cohort_list").html('');
  var html_cb = '';
  var cohort_length = data.cohorts.length;
  for (var i=0; i<cohort_length;i++) {
    id = 'cohort_'+i;
    var cohort = data.cohorts[i];
    var is_disabled = '';
    if (cohort_length == 1) {
      is_disabled = ' disabled';
    }
    html_cb += '<div>'+
               '  <input type="checkbox" class="benchmark_cohort_cb" checked'+is_disabled+' value="'+cohort+'" id="'+id+'">'+
               '  <label class="mb-0" for="'+id+'"> '+cohort+'</label>'+
               '</div>';
  }
  $("#benchmark_cohort_list").append(html_cb);
}


// Build "Ancestry" form
function fill_ancestry_form(data, cohorts) {
  var previous_unselected = [];
  $(".benchmark_ancestry_cb").each(function () {
    if ($(this).prop("checked") == false)  {
      previous_unselected.push($(this).val());
    }
  });

  $("#benchmark_ancestry_list").html('');
  var ancestry_list = [];
  var html_cb = '';
  // Cohorts
  for (var i=0; i<cohorts.length;i++) {
    var cohort = cohorts[i];
    var cohort_ancestry_list = data.ancestries[cohort];
    // Ancestries
    for (var j=0; j<cohort_ancestry_list.length;j++) {
      var ancestry = cohort_ancestry_list[j];
      if (!ancestry_list.includes(ancestry)) {
        ancestry_list.push(ancestry);
      }
    }
  }
  // Generate HTML checkboxes
  for (var k=0; k<ancestry_list.length;k++) {
    id = 'gpName_'+k;
    var ancestry = ancestry_list[k];
    var colour = chart_colours[k];
    var is_checked = ' checked';
    if (previous_unselected.includes(ancestry)) {
      is_checked = '';
    }
    var is_disabled = '';
    if (ancestry_list.length == 1) {
      is_disabled = ' disabled';
    }
    html_cb += '<div>'+
               '  <input type="checkbox" class="benchmark_ancestry_cb"'+is_checked+is_disabled+' value="'+ancestry+'" id="'+id+'">'+
               '  <label class="mb-0" for="'+id+'"> '+ancestry+' (<span class="fa fa-minus" style="color:'+colour+'"></span>)</label>'+
               '</div>';
  }
  $("#benchmark_ancestry_list").append(html_cb);
}


// Build "Performance Metric" form
function fill_metric_form(data, cohorts) {

  var previous_selection = $("#benchmark_metric_select option:selected").val();

  $("#benchmark_metric_select").html('');
  var metrics_list = [];
  // Cohorts - fetch metrics
  for (var i=0; i<cohorts.length;i++) {
    var cohort = cohorts[i];
    var metrics = Object.keys(data.data[cohort]);
    for (var j=0; j<metrics.length;j++) {
      var metric = metrics[j];
      if (!metrics_list.includes(metric)) {
        metrics_list.push(metric);
      }
    }
  }
  // Fill the form
  for (var k=0; k<metrics_list.length;k++) {
    var metric = metrics_list[k];
    var option = new Option(metric, metric);
    if (previous_selection && metric == previous_selection) {
      option = new Option(metric, metric, true, true);
    }
    $("#benchmark_metric_select").append(option);
  }
}


// Build "Sex" form
function fill_sex_form(data, cohorts) {

  var previous_selection = $('input[name="benchmark_sex_type"]:checked').val();
  var metric = $("#benchmark_metric_select option:selected").val();

  $("#benchmark_sex_list").html('');
  var sex_list = [];
  var html_rb = '';
  // Cohorts - fetch sexes
  for (var i=0; i<cohorts.length;i++) {
    var cohort = cohorts[i];
    var cohort_sex_list = data.sexes[cohort];
    // List sexes from the selected metric
    if (metric in data.data[cohort]) {
      // Sexes
      for (var j=0; j<cohort_sex_list.length;j++) {
        var sex_type = cohort_sex_list[j];
        if (!sex_list.includes(sex_type) && sex_type in data.data[cohort][metric]) {
          sex_list.push(sex_type);
        }
      }
    }
  }

  // Setup the radio button selected by default
  var entry_to_check = sex_list[0];
  if (previous_selection && sex_list.includes(previous_selection)) {
    entry_to_check = previous_selection;
  }

  // Generate HTML radio buttons
  for (var k=0; k<sex_list.length;k++) {
    id = 'sex_type_'+k;
    var sex_type = sex_list[k];
    var is_checked = '';
    if (entry_to_check == sex_type) {
      is_checked = ' checked';
    }
    var is_disabled = '';
    if (sex_list.length == 1) {
      is_disabled = ' disabled';
    }
    html_rb += '<div>'+
               '  <input type="radio" name="benchmark_sex_type" class="benchmark_sex_type_rb"'+is_checked+is_disabled+' value="'+sex_type+'" id="'+id+'">'+
               '  <label class="mb-0" for="'+id+'"> '+sex_type+'</label>'+
               '</div>';
  }
  $("#benchmark_sex_list").append(html_rb);
}


// Set the list of selected cohorts
function set_cohorts_list() {
  var c_list = [];
  $(".benchmark_cohort_cb").each(function () {
    if ($(this).prop("checked"))  {
      c_list.push($(this).val());
    }
  });
  return c_list;
}

// Set the list of distinct groups (ancestry)
function set_groupNames() {
  var gp_list = [];
  $(".benchmark_ancestry_cb").each(function () {
    if ($(this).prop("checked"))  {
      gp_list.push($(this).val());
    }
  });
  return gp_list;
}
