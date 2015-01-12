require 'redmine'
require 'issue_hooks'
require 'email_hooks'

Redmine::Plugin.register :redmine_image_clipboard_paste do
  name 'Image Clipboard Paste'
  author 'credativ Ltd'
  description 'Allow pasting an image from the clipboard into the comment box on the form'
  version '1.0.0'
  requires_redmine :version_or_higher => '2.3.0'
end

ActionMailer::Base.register_interceptor(InlineImagesEmailInterceptor)

