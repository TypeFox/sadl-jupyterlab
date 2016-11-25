"""Tornado handlers for the SADL."""

import os
from datetime import timedelta
from tornado import web, escape, httpclient, httputil
from notebook.base.handlers import IPythonHandler, FileFindHandler, json_errors
from jinja2 import FileSystemLoader
from notebook.utils import url_path_join as ujoin
from subprocess import Popen, PIPE, STDOUT
from io import StringIO
from threading import Thread
from os.path import expanduser

import json


#-----------------------------------------------------------------------------
# Module globals
#-----------------------------------------------------------------------------

DEV_NOTE_NPM = """It looks like you're running SADL Jupyter Extension from source.
If you're working on the TypeScript sources of SADL Jupyter Extension, try running

    npm run watch

from the SADL Jupyter Extension repo directory in another terminal window to have the system
incrementally watch and build SADL Jupyter Extension's TypeScript for you, as you make
changes.
"""

HERE = os.path.dirname(__file__)
FILE_LOADER = FileSystemLoader(HERE)
BUILT_FILES = os.path.join(HERE, 'build')
PREFIX = '/sadl'

class SadlHandler(IPythonHandler):
    """Render the SADL Jupyter Extension View."""
  
    def initialize(self, notebook_path):
        self.notebook_path = notebook_path
    
    @web.authenticated
    def get(self):
        self.write(self.render_template('sadl.html',
            static_prefix=ujoin(self.application.settings['base_url'], PREFIX),
            page_title='SADL - Semantic Web Editing',
            terminals_available=self.settings['terminals_available'],
            mathjax_url=self.mathjax_url,
            mathjax_config='TeX-AMS_HTML-full,Safe',
            notebook_path = self.notebook_path
        ))

    def get_template(self, name):
        return FILE_LOADER.load(self.settings['jinja2_env'], name)

#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------

def _jupyter_server_extension_paths():
    return [{
        "module": "sadl_web"
    }]


def load_jupyter_server_extension(nbapp):
    if isDevMode():
        nbapp.log.info(DEV_NOTE_NPM)
    nbapp.log.info('SADL Jupyter Extension alpha preview extension loaded from %s'%HERE)
    webapp = nbapp.web_app
    base_url = webapp.settings['base_url']
    
    webapp.add_handlers(".*$", [
        (ujoin(base_url, PREFIX), SadlHandler, {
            'notebook_path': nbapp.notebook_dir
        }),
        (ujoin(base_url, PREFIX+r"/(.*)"), FileFindHandler, {
            'path': BUILT_FILES
        })
    ])
    
def isDevMode():
    base_dir = os.path.realpath(os.path.join(HERE, '..', '..', '..'))
    return os.path.exists(os.path.join(base_dir, '.git'))


    
        