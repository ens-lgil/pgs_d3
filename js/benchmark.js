
class Benchmark {

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

    // X categories and groups
    this.categoriesNames = [...new Set(chart_data.map(item => item.pgs))];
    this.groupNames = [];
    this.set_groupNames();

    // Draw chart
    this.draw_chart(chart_data);
  }


  // Draw the different components of the chart
  draw_chart(chart_data) {

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    console.log(this.categoriesNames);
    console.log(this.groupNames);

    var min_value = d3.min(chart_data, function(d) { return (d.eb); });
    if (min_value > 0) {
      min_value = 0
    }
    else {
      min_value = min_value + ((min_value/100)*10);
    }
    var max_value = d3.max(chart_data, function(d) { return (d.et); });
    max_value = max_value + ((max_value/100)*10);


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
        .range(["#367DB7", "#4CAE49", "#974DA2"]);


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
      .attr('transform', 'translate(0,' + this.chartHeight + ')')
      .call( d3.axisBottom(this.x0) );
    var yAxis = this.g.append('g')
      .call( d3.axisLeft(this.y) );


    // X axis label
    this.svg.append("text")
      .attr("transform", "translate(" + (this.chartWidth/2) + " ," + (this.height - 20) + ")")
      .style("text-anchor", "middle")
      .text("PGS Catalog Score ID");

    // Y axis label
    this.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", 0 - (this.height / 2))
        //.attr("y", 0 - margin.left)
        //.attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Hazard Ratio (HR)");

  }


  // Draw the horizontal line (threshold)
  addHorizontalLine(min_value) {
    if (min_value < 0) {
      this.g.append("line")
        .attr("stroke", 'black')
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("6, 6"))
        .attr('x1', 0)
        .attr('x2', this.chartWidth)
        .attr('y1', this.y(0))
        .attr('y2', this.y(0));
    }
  }


  // Draw the chart content
  addData() {

    var selected_data = [];
    for (var i=0;i<this.chart_data.length;i++) {
      if (this.groupNames.indexOf(this.chart_data[i].grpName) != -1) {
        selected_data.push(this.chart_data[i]);
      }
    }

    var chart_content = this.g.append("g").attr('class', 'chart_content');

    /* Lines */

    var lines = chart_content.selectAll('line.error')
      .data(selected_data);
      //.data(chart_data);

    var obj = this;

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


    /* Points */

    var points = chart_content.selectAll('circle.point')
      .data(selected_data);
        //.data(chart_data);

    points.enter()
      .append('circle')
      .attr('class', function(d) { return 'point '+d.grpName })
      .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
      .attr('r', 4)
      .attr("fill", function(d) { return obj.z(d.grpName); })
      .attr('cx', function(d) { return obj.x1(d.grpName); })
      .attr('cy', function(d) { return obj.y(d.y); });


    /* Rectangle area used by tooltip */
    chart_content.selectAll('rect')
      .data(selected_data)
      .enter()
      .append('rect')
      .attr('class', function(d) { return 'rect '+d.grpName })
      .attr("transform",function(d) { return "translate(" + obj.x0(d.pgs) + ",0)"; })
      .each(function(d,i){
        addTooltip($(this), d);
      })
      .attr("x", function(d) { return obj.x1(d.grpName) - 6; })
      .attr("y", function(d) { return obj.y(d.et) - 1; })
      .attr("width", 12)
      .attr("height", function(d) { return obj.y(d.eb) - obj.y(d.et) + 2; })
      .attr("fill", "transparent");
  }


  // Draw the legend
  addLegend() {

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
    legend.append("circle")
      .attr("r", 4)
      .attr("cx", this.chartWidth + 20)
      .attr("cy", 9.5)
      .attr("fill", this.z);
    legend.append("line")
      .attr("x1", this.chartWidth + 10)
      .attr("x2", this.chartWidth + 30)
      .attr("y1", 9.5)
      .attr("y2", 9.5)
      .attr("stroke", this.z)
      .attr("stroke-width", 2);
    legend.append("text")
      .attr("x", this.chartWidth + 40)
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


  // This function updates the chart when an ancestry is checked in or out
  update_ancestry(){

    // Reset the lisy of group names (Ancestry)
    this.set_groupNames();

    // Remove chart content
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
    //x1.domain(checked_gp_names);
    x1.domain(checked_gp_names).rangeRound([0, x0.bandwidth()]);*/
  }
}


// Add tooltip on the chart elements
var addTooltip = function(elem, data) {
  elem.tooltip({
    'title': "Ancestry: <b>"+data.grpName + "</b><br/>Upper 95: <b>" + data.et + "</b><br/>Estimate: <b>" + data.y + "</b><br/>Lower 95: <b>" + data.eb+"</b>",
    'placement': 'right',
    'html': true
  });
}

$("#exportPDF").click(() => {
  let svg = new XMLSerializer().serializeToString(document.getElementById("pgs_chart"));
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
    doc.save('pgs_benchmark.pdf');
  };
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svg));
});


$("#exportPNG").on("click", function() {
  var svgString = getSVGString(svg.node());
  svgString2Image( svgString, 2*width, 2*height, 'png');//, save ); // passes Blob and filesize String to the callback

  /*function save( dataBlob, filesize ){
    saveAs( dataBlob, 'PGS_benchmark.png' ); // FileSaver.js function
  }*/
});


// Below are the functions that handle actual exporting:
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
  var format = format ? format : 'png';

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
      saveAs( blob, 'PGS_benchmark.png' );
      //var filesize = Math.round( blob.length/1024 ) + ' KB';
      //if ( callback ) callback( blob, filesize );
    });
  };
  image.src = imgsrc;
}
