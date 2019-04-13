let table, years, regions
let prevResults = {}

const $ = id => document.getElementById(id)
window.onload = function() {
  const csv = $('csv').textContent
  table = parseCsv(csv)
  const headings = table[4]
  years = headings.slice(0, -5).reduce((a, v, i) => {
    if (v.match(/\d\d\d\d/)) {
      a[v] = i
    }
    return a
  }, {})

  regions = table.reduce((a, v, i) => {
    if (i > 4 && rangeIsComplete(getRange(years['1960'], i))) {
      a[v[0]] = i
    }
    return a
  }, {})

  Object.keys(years).forEach(function(k) {
    const option = document.createElement('option')
    option.value = years[k]
    option.innerHTML = k
    $('year').appendChild(option)
  })
  renderRegionSelect(regions, regions['United Kingdom'])
  urlToState()
 
  $('calc').onclick = calcCumulative
  $('region').onchange = filterYears
  $('year').onchange = filterRegions
}

window.onpopstate = function(){
    urlToState()
}

function urlToState(){
 if (window.location.search) {
     prevResults = {}
    window.location.search
      .substring(1)
      .split(',')
      .map(x => x.split(':'))
      .forEach(pair => {
        const year = findKey(pair[0], years)
        const region = findKey(pair[1], regions)
        const co2 = getCO2(pair[0], pair[1])
        if (co2 !== false) addPrevResult(year, region, co2)
      })
    renderPrevResults()
  }
}

function findKey(val, obj) {
  const keyIndex = Object.values(obj).indexOf(parseInt(val))
  if (keyIndex !== -1) {
    return Object.keys(obj)[keyIndex]
  } else {
    return null
  }
}

function renderRegionSelect(regions, selectedRegion) {
  console.log({selectedRegion})
  $('region').innerHTML = ''
  Object.keys(regions).forEach(function(k) {
    const option = document.createElement('option')
    option.value = regions[k]
    option.innerHTML = k
    if (selectedRegion == regions[k]) {
      console.log({selectedRegion, regionsK: regions[k], k})
      option.setAttribute('selected', 'selected')
    }
    $('region').appendChild(option)
  })
}

function getVal(id) {
  const selector = $(id)
  return selector[selector.selectedIndex].value
}
function getText(id) {
  const selector = $(id)
  return selector[selector.selectedIndex].textContent
}

function getCO2(yearIndex, regionIndex) {
  const values = getRange(yearIndex, regionIndex)
  return rangeIsComplete(values)
    ? Number(values.reduce((a, b) => a + new Number(b), 0)).toFixed(2)
    : false
}

function calcCumulative() {
  console.log('Calculate cumulative')
  const yearIndex = getVal('year')
  const regionIndex = getVal('region')
  const sum = getCO2(yearIndex, regionIndex)
  if (sum !== false) {
    const region = getText('region')
    const year = getText('year')
    addPrevResult(year, region, sum)
    renderPrevResults()
    $('result').innerHTML = sum + '  tonnes of CO2'
    history.pushState(
      null,
      null,
      (location.search ? location.search + ',' : '?') +
        yearIndex +
        ':' +
        regionIndex,
    )
  } else {
    $('result').innerHTML = 'Sorry incomplete data for this region'
  }
}
function getRange(yearIndex, regionIndex) {
  return table[regionIndex].slice(yearIndex, -5)
}
function rangeIsComplete(range) {
  return range.indexOf('') === -1
}
function filterYears(el) {
  const regionIndex = el.target.value
}
function filterRegions(el) {
  const regionIndex = getVal('region')
  const yearIndex = el.target.value
  const regions = table.reduce((a, v, i) => {
    if (i > 4 && rangeIsComplete(getRange(yearIndex, i))) {
      a[v[0]] = i
    }
    return a
  }, {})
  console.log(regions)
  renderRegionSelect(regions, regionIndex)
}

function h(tag, content, attrs) {
  const el = document.createElement(tag)
  if (content) {
    appendH(el, content)
  }
  if (attrs) {
    Object.keys(attrs).forEach(x => {
      el.setAttribute(x, attrs[x])
    })
  }
  return el
}

function appendH(el, content) {
  if (typeof content === 'string') {
    el.appendChild(document.createTextNode(content))
  } else if (Array.isArray(content)) {
    content.forEach(x => {
      appendH(el, x)
    })
  } else {
    el.appendChild(content)
  }
  return el
}
function renderPrevResults() {
  const resultTable = Object.values(prevResults).reduce((table, result) => {
    const specialNotes = regionMetadata
      .filter(x => x.TableName == result.region)
      .map(x => x.SpecialNotes)
      .join('\n')

    const regionHTML = specialNotes
      ? h('span', result.region, {
          style: 'cursor: help',
          title: specialNotes,
        })
      : result.region

    return appendH(
      table,
      h('tr', [
        h('td', regionHTML),
        h('td', result.year),
        h('td', [
          h('span', '', {
            style:
              'width: ' +
              parseInt(result.co2 / 2) +
              'px; background-color: SteelBlue; height: 1em; display:inline-block; margin-right: 0.25em',
          }),
          result.co2 + '',
        ]),
      ]),
    )
  }, h('table', h('tr', [h('th', 'Region'), h('th', 'Starting Year'), h('th', 'CO2')])))
  const container = $('prev-results')
  console.log(prevResults, resultTable, container)
  container.innerHTML = ''
  container.appendChild(resultTable)
}

function addPrevResult(year, region, co2) {
  const key = region + ' - ' + year
  const val = {year, region, co2}
  prevResults[key] = val
}

function parseCsv(csv) {
  return csv
    .split('\n')
    .map(line => line.split(',').map(v => v.replace(/"/g, '')))
}
