class InlineImagesEmailInterceptor
  def self.delivering_email(message)
    has_images = false

    message.body.parts.each do |part|
      if part.mime_type == "text/html"
        has_images = part.body.to_s.include? "<img src="
      end
    end

    if has_images
      # Delete text part so we can use
      # multipart/related content-type for message
      message.body.parts.select! { |part| part.mime_type == 'text/html' }

      message.body.parts.each do |part|
        if part.mime_type == "text/html"
          # search for <img> tags
          part.body = part.body.to_s.gsub(/(<img src=")([^"]+)(")/) do
            image_url = $2
            attachment_url = image_url
            attachment_object = Attachment.where(:filename => File.basename(image_url)).first
            if attachment_object
              # Use CIDs
              message.attachments.inline[attachment_object.filename] = File.read(attachment_object.diskfile)
              attachment_url = message.attachments[attachment_object.filename].url

              # Alternatively use Base64
              # attachment_url = "data:#{Redmine::MimeType.of(attachment_object.diskfile)};base64,#{Base64.encode64(open(attachment_object.diskfile) { |io| io.read })}"
            end

            $1 << attachment_url << $3
          end
        end
      end

      # Dirty hack for setting content-type to multipart/related
      message.content_type = message.content_type.gsub(/(multipart\/)[^;]+(;)/, '\1related\2')
    end
  end
end