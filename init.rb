require 'redmine'
require 'image_clipboard_paste/hooks'

Redmine::Plugin.register :redmine_image_clipboard_paste do
  name 'Image Clipboard Paste'
  author 'credativ Ltd'
  description 'Allow pasting an image from the clipboard into the comment box on the form'
  version '3.3.0'
  requires_redmine :version_or_higher => '2.3.0'
end
