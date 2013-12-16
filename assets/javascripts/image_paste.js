jQuery.event.props.push('clipboardData');

function pasteImageName(e, name) {
    var text = ' !' + name + '! '
    var scrollPos = e.scrollTop;
    var method = ((e.selectionStart || e.selectionStart == '0') ? 1 : (document.selection ? 2 : false ) );
    if (method == 2) { 
        e.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -e.value.length);
        strPos = range.text.length;
    }
    else if (method == 1) strPos = e.selectionStart;

    var front = (e.value).substring(0,strPos);  
    var back = (e.value).substring(strPos,e.value.length); 
    e.value=front+text+back;
    strPos = strPos + text.length;
    if (method == 2) { 
        e.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -e.value.length);
        range.moveStart ('character', strPos);
        range.moveEnd ('character', 0);
        range.select();
    }
    else if (method == 1) {
        e.selectionStart = strPos;
        e.selectionEnd = strPos;
        e.focus();
    }
    e.scrollTop = scrollPos;
}

$( document ).ready(function() {
    $('.wiki-edit').each(function(){
            this.addEventListener('drop', function (e) {
                for (var file = 0; file<e.dataTransfer.files.length; file++)
                {
                    if (e.dataTransfer.files[file].type.indexOf('image/') != -1)
                    {
                        var timestamp = Math.round(+new Date()/1000);
                        var name = 'screenshot_'+addFile.nextAttachmentId+'_'+timestamp+'_'+e.dataTransfer.files[file].name;
                        var blob = e.dataTransfer.files[file].slice();
                        blob.name = name;
                        uploadAndAttachFiles([blob], $('input:file.file_selector'));
                        pasteImageName(this, name);

                        e.preventDefault();
                        e.stopPropagation();
                        break;
                    }
                }
            });
        });

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
                pasteImageName(this, name);

                e.preventDefault();
                e.stopPropagation();
                break;
            }
        }
    });
});

