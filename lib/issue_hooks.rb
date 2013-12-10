class RedmineImageClipboardPasteHook < Redmine::Hook::ViewListener
  render_on :view_issues_form_details_bottom, :partial => 'imagepaste'
end
