/************************

    mystic pouch

    creates a styled div in absolute position on the page by injecting a div into the
    DOM and running a Top Pages API call to Chartbeat.

    specify a title for the container and JSON to pass into the constructor (obtained from caching layer).

    styling of output can be edited in styles.css. This div can be set up anywhere on the page and filled w any custom data.

    sorting functions are specific to the goals of this particular pouch. any sort on the JSON can be set up.

*************************/


/* Pouch constructor. Creates Pouch w specified attributes.
accepts: div ID to replace w styled pouch contents, JSON elements, title to display above the list
returns: built pouch container
*/
class Pouch {
  constructor(selector, elements, pouch_title) {
    this.selector = selector;
    this.elements = elements;
    this.pouchTitle = pouch_title;
  }
  // returns built pouch object
  build () {
    return pouchContainer(this);
  }

  // inserts pouch contents onto injected div element on page
  insert () {
    createPouchDiv(document, this);
    document.getElementById(this.selector).innerHTML = this.build();
  }
}


// creates div with Pouch.selector as the id so we can inject the contents and style
// accepts: document object (to avoid scoping issues), pouch object
// returns: void function - creates the div on page and exits
function createPouchDiv(doc, pouchObj) {
  var recircWidg = doc.createElement("div");
  recircWidg.id = pouchObj.selector;
  doc.body.insertBefore(recircWidg, doc.body.childNodes[0]);
}


// this is the inner HTML that is inserted into the created div element. In this case
// it's just a list of top articles with a close button, but this html can be whatever
// you want and styled however you want!
// accepts: pouch object
// returns: desired inner HTML for div
pouchContainer = (pouchObj) => (
  `
  <div id="pouch-close">
    <div id="pouch-top">
      <div id="pouch-title" class="pouch-flex-item">
        ${pouchObj.pouchTitle}
      </div>
      <div id="pouch-close-me" class="pouch-flex-item">
        Close [x]
      </div>
    </div>
    ${buildContents(pouchObj)}
  </div>
  `
)


// builds list of items to insert into the pouch container
// accepts: pouch object
// returns: pouchItem (in this case, div container that has a link to the article)
function buildContents (pouchObj) {
  var pouchContents = "";
    pouchObj.elements.forEach(function(element) {
      pouchContents += pouchItem(element);
    });
    return pouchContents;
}


// creates an item to append to the pouchContents string and insert into the pouch container
// accepts: individual element of the top pages json object
// returns: div element containing an anchor tag linking to path of article, with title
pouchItem = (element) => (
  `
  <div><a href=${JSON.stringify(element['path'])}>${JSON.parse(JSON.stringify(element['title']))}</a></div>
  `
)


// this function executes all of the necessary functions to build the div on screen. that is, hits
// our api using a callback and calls the functions to sort and display the resulting data.
// also creates the onclick listener for the close functionality.
// accepts: endpoint URL, page config (_sf_async_config)
// returns: void function
function createPouch (endpoint, config) {

  fetch(endpoint)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      var top_five = topFive(json, config);

      var pouchComponent = new Pouch('recircWidg', top_five, 'Most Popular Related Articles');
      pouchComponent.insert();

      document.getElementById('pouch-close-me').onclick = function(){
       document.body.removeChild(document.getElementById(pouchComponent.selector));
       return false;
      };

    });
};

// callback function that checks to see if _sf_async_config is defined on the page, if so,
// sends the config information back
// accepts: callback function
// returns: config information (_sf_async_config)
function onPageConfigFound(callback) {
  var retries = 0, maxRetries = 300;
  var interval = setInterval(function() {
    if (window['_sf_async_config'] &&
      window['_sf_async_config']['domain'] &&
      window['_sf_async_config']['path']) {

      clearInterval(interval);

      var config = _sf_async_config;
      callback(config);

    } else {
      retries += 1;
      if (retries > maxRetries) {
        clearInterval(interval);
      }
    }
  }, 50);
}


// Compares _sf_async_config.sections set on the browser page to the page data objects'.
// if sections on the page being checked is set to "" or is not defined,
// returns true.
// if sections is defined but equals 'home' or 'homepage', returns true
// if any section value tagged on the page matches
// any section value tagged in a particular page object in the cached data
// object, returns true.
// if none of the above, returns false
function sectionChecker (site_data_sections, page_data_sections) {

    // If the site uses an empty section tag or does not define sections at all,
    // just returns true, effectively providing top 5 articles on the site regardless
    // of section tagging
    if (page_data_sections === "" || page_data_sections === undefined) {
        //console.log('page has no sections defined:' + page_data_sections);
        return true;
    }
    else {
        var page_data_sections = page_data_sections.split(',');

        // Including a call to just return true for a match for a section if either of these commonly
        // employed home page sections are tagged
        if(page_data_sections[0].toLowerCase() == 'home' || page_data_sections[0].toLowerCase() == 'homepage') {
            //console.log('homepage has home or homepage defined');
            return true;
        }


        // Some useful console log statements to check the sections of the data object being iterated through
        // (JSON) and the sections tagged on the page. It's commented out here but feel free to use.
        /*
        console.log(site_data_sections);
        console.log(page_data_sections);
        console.log('page data object has sections');
        */

        for (var i=0; i < page_data_sections.length; i++) {
          for (var j=0; j < site_data_sections.length; j++) {
            if (page_data_sections[i].toLowerCase() == site_data_sections[j].toLowerCase()) {
              //console.log('sections match')
              return true;
            }
          }
        }
        //console.log('sections don\'t match')
        return false;
    }
}


// this function detects and removes the domain from a given url and returns it.
// returns url in format /page1/page2/path1234.html. This is important to ensure
// correct relative pathing from the domain.
function scrubPath(url)   {
  var path = "";
  if (url.indexOf("://") > -1) {
      domain = url.split('/')[2];
  }
  else {
      domain = url.split('/')[0];
  }
  // find & remove port number
  domain = domain.split(':')[0];
  url = url.split('/');

  url.forEach(function(item){
      if (item !== domain) {
          path += "/"+item;
      }
  });
  return path;
}


// pushes top 5 articles ranked by concurrents * engaged time, excluding landing pages and current path, to an array.
// basic flow of this function is creating an empty array, then pushing pages from the JSON object to the div if the sections
// match by invoking sectionChecker(). Also scrubs URLs
// accepts: unsorted JSON object containing top pages, _sf_async_config config variable
// returns: JSON object containing array of top 5 sorted page objects
function topFive (pagesObject, config) {

  var topFiveList = [];
  var i = 0;

  while (topFiveList.length < 5 && i < pagesObject.pages.length) {
    pagesObject.pages[i].path = scrubPath(pagesObject.pages[i].path);
    config.path = scrubPath(config.path);

    // If the page in the data object is not a landing page (is an article) AND does not share a path with the current page AND shares a section, it's pushed to the new array
    if (pagesObject.pages[i].stats.article !== 0 && pagesObject.pages[i].path !== config.path && sectionChecker(pagesObject.pages[i].sections, config.sections)){
      topFiveList.push(pagesObject.pages[i]);
    }
    i++;
  }

// below is a useful console log output for observing if items are contained in topFiveList - if so, outputs items.
// we left this in for debugging purposes -- please uncomment if you would like to observe the objects in the
// topFiveList
 /*
 console.log('top five list ------');
 topFiveList.forEach(function(item) {
  console.dir(item);
 });
 console.log('top five list ------');
 */

 return topFiveList;
};


// function to pass into sort() that tells sort() to use avg engaged time * concurrents as the sorting value
compare = function (prev, next) {
  console.log('inside compare');

  let prevVal = prev.stats.engaged_time.avg * prev.stats.people;
  let nextVal = next.stats.engaged_time.avg * next.stats.people;

  if (prevVal < nextVal) {
    return 1;
  } else if (prevVal > nextVal) {
    return -1;
  } else {
    return 0;
  }
}

// callback function that accepts the page config and hits the python data caching layer. once the response is received
// in the callback, executes createPouch
onPageConfigFound(function(config) {
  var endpoint = 'http://127.0.0.1:8000/?domain='+config.domain;
  createPouch(endpoint, config);
});
