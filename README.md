# Redmine Image Clipboard Paste

Plugin for redmine which allows pasting image data from the clipboard directly into the comments input field on a new ticket or comment. The image will be given an arbitrary filename and added as an attachment and also inserted into the comment text using Redmine's markup language (textile or markdown).

## Features

* Paste images from the clipboard
* Drag and drop image files directly into the input element
* Added to ticket as an attachment
* Added into the comment text field using Redmine's markup language

## Getting the plugin

A copy of the plugin can be downloaded from GitHub: https://github.com/thorin/redmine_image_clipboard_paste

## Installation

To install the plugin clone the repro from github and migrate the database:

```
cd /path/to/redmine/
git clone git://github.com/thorin/redmine_image_clipboard_paste.git plugins/redmine_image_clipboard_paste
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

To uninstall the plugin migrate the database back and remove the plugin:

```
cd /path/to/redmine/
bundle exec rake redmine:plugins:migrate NAME=redmine_image_clipboard_paste VERSION=0 RAILS_ENV=production
rm -rf plugins/redmine_image_clipboard_paste
```

Further information about plugin installation can be found at: http://www.redmine.org/wiki/redmine/Plugins

## Compatibility

The latest version of this plugin is tested with Redmine 3.3.2.

Drag and drop should be supported by all modern browsers, tested with Chrome, Firefox and IE.

## License

This plugin is licensed under the GNU GPLv2 license. See LICENSE-file for details.

## Copyright

Copyright (c) 2013 credativ Ltd.

