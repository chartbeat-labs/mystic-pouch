# PROJECT MYSTIC POUCH
# Recirculation Widget - Top Pages List via Top Pages API

<p>This widget is meant as an example for building a Top Pages widget and using Chartbeat APIs on your site. This returns the top 5 articles that share a section with the current page the widget is opened on, ranked by avg engaged time * concurrents. If no sections are tagged it just returns top the 5 articles</p>

<h2>STEP 1:</h2>
<p>Install dependencies</p>

<p>Install CORS flask extension <code>pip install -U flask-cors</code> https://flask-cors.readthedocs.org/en/latest/<p>
<p>Install requests <code>pip install requests</code></p>

<h2>STEP 2:</h2>

<p>Insert your API key into inpage_recirc_worker.py.</p>

<h2>STEP 3:</h2>

<h3>Set up a bookmarklet that runs the code.</h3>

<p>Create bookmark in your browser with any name, select "Edit" on the bookmark and insert the following as the URL <code>javascript:void(function(){var head=document.head||document.getElementsByTagName('head')[0];var style=document.createElement('link');style.type='text/css';style.rel='stylesheet';style.href='http://127.0.0.1:8000/css/styles.css';head.appendChild(style);script=document.createElement('script');script.src='http://127.0.0.1:8000/scripts/mysticPouch.js';document.body.appendChild(script);})();</code></p>

<p>This hosts up your javascript and css on the flask server and executes it on the page</p>

<h2>STEP 4:</h2>

<p>For testing: In terminal run <code>python inpage_recirc_worker.py</code> in the project home dir which serves up the data object on a local server (port: 8000) (inpage-recirc2 requests from inpage_recirc_worker.py).</p>
<p>For use: Host the inpage_recirc_worker.py file locally and update onPageConfigFound() in mysticPouch.js so that the request points to that file. Be sure to retain the "?domain='+config.domain;" parameter appended to the URL of the request. Please note that any change to the location of the locally hosted file will also break the bookmarklet -- this must be updated in there as well if you want to continue to use the bookmarklet after setting this up.</p>

<h2>STEP 5:</h2>
<p>Open any URL hosting Chartbeat code that your API key has permission to access, let the page load complete and click the bookmarklet. It should load!</p>
