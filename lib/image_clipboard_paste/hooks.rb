module ImageClipboardPaste
  class Hooks < Redmine::Hook::ViewListener
    def view_layouts_base_body_bottom(context={})
      controller = context[:controller]
      if controller.is_a?(IssuesController) || controller.is_a?(BoardsController) || controller.is_a?(MessagesController) || controller.is_a?(WikiController) || controller.is_a?(NewsController)

        javascript_include_tag 'image_paste.js', :plugin => 'redmine_image_clipboard_paste'

      end
    end
  end
end