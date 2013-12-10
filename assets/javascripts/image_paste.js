jQuery.event.props.push('clipboardData');
$( document ).ready(function() {
    $('.wiki-edit').bind('paste', function (e) {
        var clipboardData;
        if (document.attachEvent) clipboardData = window.clipboardData;
        else clipboardData = e.clipboardData;
        for (var file = 0; file<clipboardData.items.length; file++)
        {
            if (clipboardData.items[file].type.indexOf('image/') != -1)
            {
                /* Get file name and type details */
                var ext = '';
                switch (clipboardData.items[file].type)
                {
                    case 'image/gif':
                        ext = '.gif';
                        break;
                    case 'image/jpeg', 'image/jpg', 'image/pjpeg':
                        ext = '.jpg';
                        break;
                    case 'image/png':
                        ext = '.png';
                        break;
                    case 'image/svg+xml', 'image/svg':
                        ext = '.svg';
                        break;
                    case 'image/tiff', 'image/tif':
                        ext = '.tiff';
                        break;
                    case 'image/bmp', 'image/x-bmp', 'image/x-ms-bmp':
                        ext = '.bmp';
                        break;
                }
                var fileinput = $('.file_selector').get(0);
                var timestamp = Math.round(+new Date()/1000);
                var name = 'screenshot_'+addFile.nextAttachmentId+'_'+timestamp+ext;

                /* Upload pasted image */
                var blob = clipboardData.items[file].getAsFile();
                blob.name = name; /* Not very elegent, but we pretent the Blob is actually a File */
                uploadAndAttachFiles([blob], fileinput);

                /* Inset text into input */
                var text = '!' + name + '!'
                var scrollPos = this.scrollTop;
                var method = ((this.selectionStart || this.selectionStart == '0') ? 1 : (document.selection ? 2 : false ) );
                if (method == 2) { 
                    this.focus();
                    var range = document.selection.createRange();
                    range.moveStart ('character', -this.value.length);
                    strPos = range.text.length;
                }
                else if (method == 1) strPos = this.selectionStart;

                var front = (this.value).substring(0,strPos);  
                var back = (this.value).substring(strPos,this.value.length); 
                this.value=front+text+back;
                strPos = strPos + text.length;
                if (method == 2) { 
                    this.focus();
                    var range = document.selection.createRange();
                    range.moveStart ('character', -this.value.length);
                    range.moveStart ('character', strPos);
                    range.moveEnd ('character', 0);
                    range.select();
                }
                else if (method == 1) {
                    this.selectionStart = strPos;
                    this.selectionEnd = strPos;
                    this.focus();
                }
                this.scrollTop = scrollPos;

                break;
            }
        }
    });
});

