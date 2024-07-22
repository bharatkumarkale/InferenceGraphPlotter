const legend_settings = {
    'name' : 'Legend Position',
    'multi_select': 'no',
    'values': ['Right', 'Bottom', 'Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']
};
let filters = [],
    selectors = [],
    inputs = ['X-axis Title', 'Y-axis Title', 'Y-Min', 'Y-Max', 'Plot Title'],
    data = [],
    filtersContainer = d3.selectAll('#filterControls'),
    selectorsContainer = d3.select('#selectorControls'),
    filters_values = {},
    selector_values = {},
    targetEle = d3.selectAll('#canvas'),
    total_width = targetEle.node().getBoundingClientRect().width,
    total_height = targetEle.node().getBoundingClientRect().height-20,
    margin,
    width,
    height,
    targetSVG = targetEle.append('svg'),
    targetG = targetSVG.append('g'),
    x_scale = d3.scaleLinear(),
    y_scale = d3.scaleLinear(),
    color_scale = d3.scaleOrdinal(d3.schemeCategory10),
    line = d3.line(),
    legend_title = '',
    num_attrs_in_legend = 0,
    legend_width,
    legend_height,
    legend_position = 'Right',
    legendG = targetSVG.append('g');

function init(plot_data) { 
    let top_margin = 0,
        right_margin = 0,
        legend_item_max_length = d3.max(d3.map(plot_data, d=>d['c'].length));
    console.log(legend_item_max_length);

    if (legend_item_max_length > 25) {
        right_margin = 400;
    } else if (legend_item_max_length > 20) {
        right_margin = 350;
    } else if (legend_item_max_length > 15) {
        right_margin = 270;
    } else {
        right_margin = 220; 
    }

    switch (legend_position) {
        case 'Right':
            if (title.length > 110) {
                top_margin = 100;
            } else if (title.length > 50) {
                top_margin = 70;
            } else {
                top_margin = 35; 
            }
            margin = {'t':top_margin, 'l':120, 'r':right_margin, 'b':60};
            legend_width = right_margin;
            break;

        case 'Bottom':
            if (title.length > 140) {
                top_margin = 100;
            } else if (title.length > 70) {
                top_margin = 70;
            } else {
                top_margin = 35; 
            }
            margin = {'t':top_margin, 'l':120, 'r':25, 'b':150};
            legend_width = 0.95 * total_width;
            break;
            
        case 'Top Left':
        case 'Top Right':
        case 'Bottom Left':
        case 'Bottom Right':
        default:
            if (title.length > 140) {
                top_margin = 100;
            } else if (title.length > 70) {
                top_margin = 70;
            } else {
                top_margin = 35; 
            }
            margin = {'t':top_margin, 'l':120, 'r':20, 'b':60};
            legend_width = right_margin;
            break;
    }
    
    width = total_width - margin.l - margin.r;
    height = total_height - margin.t - margin.b;
    targetSVG.attr('width', total_width)
            .attr('height', total_height);
    targetG.attr('transform', `translate(${margin.l}, ${margin.t})`);
    x_scale.range([0, width]);
    y_scale.range([height, 0]);
    legend_height = 0.4 * height;
}

Promise.all([ d3.json("./data/config.json", {credentials: 'same-origin'}),
              d3.csv("./data/All_results.csv", {credentials: 'same-origin'})])
    .then(files => {
        filters = files[0].Filters;
        selectors = files[0].Selectors;
        data = files[1];
        filters.forEach(f => {
            let values = Array.from(new Set(files[1].map( d => d[f.name])));
            addFilter(filtersContainer, f, values);
        })
        addFilter(selectorsContainer, legend_settings, legend_settings.values);

        selectors.forEach(s => {
            if (s.multi_select=='yes') {
                filtersContainer.append("button")
                    .attr('class', 'btn btn-secondary dropdown-toggle')
                    .attr('type', 'button')
                    .attr('id', `dropdownMenu_${s.id}`)
                    .attr('data-bs-toggle', "dropdown")
                    .attr('aria-expanded', "false")
                    .text(s.name)

                let dropdownLst = filtersContainer.append('ul')
                                    .attr('id', `dropdown-menu_${s.id}`)
                                    .attr('class', `dropdown-menu`)
                                    .attr('aria-labelledby', `dropdownMenu_${s.id}`);

                let list = dropdownLst.selectAll(".checkbox-li")
                    .data(s.values);
    
                list.enter().append("li")
                    .attr("class", "checkbox-li")
                    .each(function(d, i) {
                        let div = d3.select(this).append("div")
                            .attr("class", "controlItem")
                            .style("padding", "0 5px");

                        div.append("input")
                            .attr("type", "checkbox")
                            .attr("class", "checkbox")
                            .attr("value", d)
                            .attr("id", "id-" + d.replace(/\W/g,'_'));
                        
                        div.append("label")
                            .attr("class", "checkbox-label")
                            .attr("for", "id-" + d.replace(/\W/g,'_'))
                            .style("padding", "0 5px")
                            .text(d);
                    });
            } else {
                filtersContainer.append('label')
                    .attr('id', `lbl_${s.id}`)
                    .attr('class', `selectorLbl`)
                    .text(s.name);

                filtersContainer.append('select')
                    .attr("name", `${s.id}`) 
                    .attr("id", `lst_${s.id}`)
                    .attr('class', `form-select selectorList`)
                    .on('change', selctorSelectionChanged);
                let dropdown = document.getElementById(`lst_${s.id}`)
                s.values.forEach((v,i) => {
                    let option = document.createElement("option");
                        option.value = v;
                        option.text = v;
                    dropdown.appendChild(option)
                })   
            }
        })

        inputs.forEach(inp => {
            let inpLbl = inp.replace(/\W/g,'_');
            selectorsContainer.append('label')
                .attr('id', `lbl_${inpLbl}`)
                .attr('class', `selectorLbl`)
                .text(inp);

            selectorsContainer.append('input')
                .attr("name", `${inpLbl}`) 
                .attr("id", `${inpLbl}`)
                .attr('class', `form-control selectorInput`);
        })

        selectorsContainer.append("button")
                .attr('class', 'btn btn-primary')
                .attr('type', 'button')
                .attr('id', `btnSubmit`)
                .text('Display')
                .on('click', display);
    });

function selctorSelectionChanged() {
    selector_values[this.name] = this.value;
}

function addFilter(container, f, values) {
    let f_name = f.name.replace(/\W/g,'_');

    if (f.multi_select=='yes') {
        container.append("button")
            .attr('class', 'btn btn-secondary dropdown-toggle')
            .attr('type', 'button')
            .attr('id', `dropdownMenu_${f_name}`)
            .attr('data-bs-toggle', "dropdown")
            .attr('aria-expanded', "false")
            .text(f.name)
            
        let dropdownLst = container.append('ul')
                            .attr('class', 'dropdown-menu')
                            .attr('id', `dropdown-menu_${f_name}`)
                            .attr('aria-labelledby', `dropdownMenu_${f_name}`);
                            
        let list = dropdownLst.selectAll(".checkbox-li")
                        .data(values);

        list.enter().append("li")
            .attr("class", "checkbox-li")
            .each(function(d, i) {
                let div = d3.select(this).append("div")
                    .attr("class", "controlItem")
                    .style("padding", "0 5px");

                div.append("input")
                    .attr("type", "checkbox")
                    .attr("class", "checkbox")
                    .attr("value", d)
                    .attr("id", "id-" + d.replace(/\W/g,'_'));
                
                div.append("label")
                    .attr("class", "checkbox-label")
                    .attr("for", "id-" + d.replace(/\W/g,'_'))
                    .style("padding", "0 5px")
                    .text(d);
            });
    } else {
        container.append('label')
            .attr('id', `lbl_${f_name}`)
            .attr('class', `filterLbl`)
            .text(f_name);

        container.append('select')
            .attr("name", `${f_name}`) 
            .attr("id", `lst_${f_name}`)
            .attr('class', `form-select selectorList`)
            .on('change', legedPositionChanged);
        let dropdown = document.getElementById(`lst_${f_name}`)
        values.forEach((v,i) => {
            let option = document.createElement("option");
                option.value = v;
                option.text = v;
            dropdown.appendChild(option)
        })
    }
}

function legedPositionChanged(params) {
    legend_position = this.value;
}

function getFilters() {
    filters_values = {};
    filters.forEach(f => {
        let f_name = f.name.replace(/\W/g,'_');
       
        d3.select(`#dropdown-menu_${f_name}`)
            .selectAll('.checkbox')
            .each(function(d, i) {
                if (f.name in filters_values) {
                    if(d3.select(this).node().checked) filters_values[f.name].push(d3.select(this).node().value);   
                } else {
                    if(d3.select(this).node().checked) filters_values[f.name] = [d3.select(this).node().value];
                }
            })
    })
}

function display() {
    title = d3.select('#Plot_Title').node().value;
    color_scale = d3.scaleOrdinal(d3.schemeCategory10);
    getFilters();
    let colorByAttrs = [];
    legend_title = '';
    num_attrs_in_legend = 0;
    d3.select(`#dropdown-menu_c`)
        .selectAll('.checkbox')
        .each(function(d, i) {
            if(d3.select(this).node().checked) {
                colorByAttrs.push(d3.select(this).node().value);
                legend_title += d3.select(this).node().value + ' + ';
                num_attrs_in_legend += 1;
            }
        })
    legend_title = legend_title.slice(0, -3);

    let filtered_data = data.filter(d => {
        for (var key in filters_values) {
            if(filters_values[key]=='' || !filters_values[key].includes(d[key]))
                return false;
        }
        return true
    });
    
    let plot_data = [],
        y_min = d3.select('#Y_Min').node().value,
        y_max = d3.select('#Y_Max').node().value;
    console.log(y_min, y_max);

    filtered_data.forEach(fd => {
        let colorByVal = '';
        colorByAttrs.forEach(c => {
            colorByVal += fd[c] + ' ';
        })
        plot_data.push({'x':+fd[selector_values['x']], 
                        'y':+fd[selector_values['y']], 
                        'c':colorByVal
                    })
    })
    y_min = y_min==="" ? 0 : +y_min;
    y_max = y_max==="" ? d3.max(plot_data, d => d.y) : +y_max;
    console.log(y_min, y_max);

    init(plot_data);
    x_scale.domain([0, d3.max(plot_data, d => d.x)]);
    y_scale.domain([y_min, y_max]);
    line.x((d) => x_scale(d.x))
        .y((d) => y_scale(d.y));

    targetG.selectAll('*').remove();
    targetG.append('g')
        .attr("class", "x-axis")
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x_scale).tickValues(d3.map(plot_data, d => d.x)).tickFormat(d3.format("d")))
    targetG.append('text')
        .attr('transform', `translate(${width/2}, ${height+30})`)
        .attr('class', 'axisText')
        .style('alignment-baseline', 'hanging')
        .style('text-anchor', 'middle')
        .text(d3.select('#X_axis_Title').node().value);
    targetG.append('g')
        .attr('class', 'x axis-grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x_scale).tickSize(-height).tickValues(d3.map(plot_data, d => d.x)).tickFormat(''));

    targetG.append('g')
        .attr("class", "y-axis")
        .call(d3.axisLeft(y_scale).ticks(7).tickFormat(d3.format("d")))
    targetG.append('text')
        .attr('transform', `translate(${-90}, ${height/2}) rotate(-90)`)
        .attr('class', 'axisText')
        .text(d3.select('#Y_axis_Title').node().value)
        .style("text-anchor", "middle");
    targetG.append('g')
        .attr('class', 'y axis-grid')
        .call(d3.axisLeft(y_scale).tickSize(-width).tickFormat(''));

    let titleG = targetG.append('g')
                    .attr('transform', `translate(0, ${-0.99 * margin.t})`)
    titleG.append("foreignObject")
            .attr("width", width)
            .attr("height", 0.98 * margin.t)
        .append("xhtml:body")
            .attr('class', 'plotTitle')
            .html(`<p>${title}`);

    
    targetG.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("class", 'bbox')
    
    d3.groups(plot_data, d=> d.c).map((item) => {
        targetG.append('path')
            .datum(item[1])
                .attr('fill', 'transparent')
                .attr('stroke', color_scale(item[0]))
                .attr('stroke-width', '2px')
                .attr('d', line)
      })
    targetG.selectAll('circle')
      .data(plot_data)
        .join('circle')
          .attr('fill', d => color_scale(d.c))
          .attr('cx', d => x_scale(d.x))
          .attr('cy', d => y_scale(d.y))
          .attr('r', 5)

    updateLegend();
}

function updateLegend() {
    let legend_items = color_scale.domain().sort((a,b) => d3.ascending(+a, +b));
    switch (legend_position) {
        case 'Right':
            updateLegend_right(legend_items);
            break;
        case 'Bottom':
            updateLegend_bottom(legend_items);
            break;
        case 'Top Left':
            updateLegend_topleft(legend_items);
            break;
        case 'Top Right':
            updateLegend_topright(legend_items);
            break;
        case 'Bottom Left':
            updateLegend_bottomlefet(legend_items);
            break;
        case 'Bottom Right':
            updateLegend_bottomright(legend_items);
            break;
        default:
            updateLegend_right(legend_items);
            break;
    }
}

function updateLegend_right(legend_items) {
    legend_height = d3.max([legend_height, 10*legend_items.length]);
    legendG.attr('transform', `translate(${total_width - 0.97*margin.r}, ${margin.t + height/2 - legend_height/2})`)

    let legend_top = num_attrs_in_legend>1 ? 20 : 40,
        legend_icon_radius = 7,
        legend_icon_padding = 5.
        legend_y_scale = d3.scaleBand().domain(legend_items).range([legend_height,legend_top]);

    legendG.selectAll('*').remove();
    
    // legendG.append('rect')
    //     .attr("x", -0.025 * margin.r)
    //     .attr("y", 0)
    //     .attr("width", legend_width)
    //     .attr("height", legend_height)
    //     .attr("class", 'bbox')

    if (num_attrs_in_legend==1) {
        legendG.selectAll(".legendTitle")
            .data([1])
            .join('text')
                .attr('transform', `translate(${legend_width/2}, 20)`)
                .attr("class", 'legendTitle')
                .text(legend_title)   
    }

    legendG.selectAll(".legendIcon")
        .data(legend_items)
        .join('circle')
            .attr('cx', legend_icon_radius)
            .attr('cy', d => legend_y_scale(d))
            .attr('r', legend_icon_radius)
            .attr('fill', d => color_scale(d))
            .attr("class", 'legendIcon')

    legendG.selectAll(".legendIconText")
        .data(legend_items)
        .join('text')
            .attr('x', 3*legend_icon_radius + legend_icon_padding)
            .attr('y', d => legend_y_scale(d))
            .attr("class", 'legendIconText')
            .style('alignment-baseline', 'middle')
            .text(d => d)   
}

function updateLegend_bottom(legend_items) {
    legendG.selectAll('*').remove();
}

function updateLegend_topleft(legend_items) {
    legendG.selectAll('*').remove();
}

function updateLegend_topright(legend_items) {
    legendG.selectAll('*').remove();
}

function updateLegend_bottomlefet(legend_items) {
    legendG.selectAll('*').remove();
}

function updateLegend_bottomright(legend_items) {
    legendG.selectAll('*').remove();
}