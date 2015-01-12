class InlineImagesEmailInterceptor
  def self.delivering_email(message)
    parts = message.body.parts
    parts.each do |part|
      if part.mime_type == "text/html"
        part.body = part.body.to_s.gsub(/(<img src=")([^"]+)(")/) do
          image_url = $2
          attachment_url = image_url
          attachment_object = Attachment.where(:filename => File.basename(image_url)).first
          if attachment_object
            message.attachments.inline[attachment_object.filename] = File.read(attachment_object.diskfile)
            attachment_url = message.attachments[attachment_object.filename].url
          end
          $1 << attachment_url << $3
        end
      end
    end
  end
end