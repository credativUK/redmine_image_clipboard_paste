jQuery.event.props.push('clipboardData');

function pasteImageName(e, name) {
    var text = '![](' + name + ') ';
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
    if (front.length == 0 || front.slice(-1) == '\n') {
        e.value=front+text+back;
    } else {
        e.value=front+' '+text+back;
    }
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

/**
* Some browser doesn't support cliboardData.items, so this function recreates a simpler version of it
* by getting the blob linked to the image.
* Currently only works when copying an image from a webpage
*/
function getDataItems(clipboardData, editElement, event) {
    clipboardData.items = [];
    for(var i = 0; i < clipboardData.types.length; i++) {
        console.log(clipboardData.types[i]);
        var data = clipboardData.getData(clipboardData.types[i]);
        if(clipboardData.types[i] == "text/html") {
            var nodes = $(data);
            for(var j = 0; j < nodes.length; j++) {
                var item = {};
                var node = nodes[j];
                if(node.tagName == 'IMG') {
                    var xhr = new XMLHttpRequest();
                    xhr.addEventListener('load', function(){
                        if (xhr.status == 200){
                            //Do something with xhr.response (not responseText), which should be a Blob
                            item.getAsFile = function() {
                                return xhr.response;
                            }
                            item.type = xhr.response.type;
                            clipboardData.items.push(item);
                            processClipboardItems(clipboardData, editElement, event);
                        }
                    });
                    xhr.open('GET', node.src);
                    xhr.responseType = 'blob';
                    xhr.send(null);
                }
            }
        }
        else if(clipboardData.types[i] == "text/plain") {
            var file_regexp = /file:\/\/.*/;
            var regexp = new RegExp(file_regexp);
            if(data.match(regexp)) {
                alert('Your browser does not support pasting images from disk. Please use the upload form.');
            }
            
        }
    }
}

function processClipboardItems(clipboardData, editElement, event) {
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
            case 'image/jpeg':
            case 'image/jpg':
            case 'image/pjpeg':
                ext = '.jpg';
                break;
            case 'image/png':
                ext = '.png';
                break;
            case 'image/svg+xml':
            case 'image/svg':
                ext = '.svg';
                break;
            case 'image/tiff':
            case 'image/tif':
                ext = '.tiff';
                break;
            case 'image/bmp': 
            case'image/x-bmp':
            case 'image/x-ms-bmp':
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
            pasteImageName(editElement, name);

            event.preventDefault();
            event.stopPropagation();
            break;
        }
        
    }

}
function preparePasteEvents() {
    $('.wiki-edit').each(function(){
            this.addEventListener('drop', function (e) {
                for (var file = 0; file<e.dataTransfer.files.length; file++)
                {
                    if (e.dataTransfer.files[file].type.indexOf('image/') != -1)
                    {
                        var timestamp = Math.round(+new Date()/1000);
                        var name = 'screenshot_'+addFile.nextAttachmentId+'_'+timestamp+'_'+e.dataTransfer.files[file].name.replace(/[ !"#%&\'()*:<=>?\[\\\]|]/g, '_');
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
        if(!clipboardData.items) {
            getDataItems(clipboardData, this);
        }
        else {
            processClipboardItems(clipboardData, this,e);
        }

    });

    uploadBlob = function (blob, uploadUrl, attachmentId, options) {
        var actualOptions = $.extend({
            loadstartEventHandler: $.noop,
            progressEventHandler: $.noop
        }, options);

        uploadUrl = uploadUrl + '?attachment_id=' + attachmentId;
        if (blob instanceof window.File || blob.name) {
            uploadUrl += '&filename=' + encodeURIComponent(blob.name);
        }

        return $.ajax(uploadUrl, {
            type: 'POST',
            contentType: 'application/octet-stream',
            beforeSend: function(jqXhr) {
            jqXhr.setRequestHeader('Accept', 'application/js');
            },
            xhr: function() {
            var xhr = $.ajaxSettings.xhr();
            xhr.upload.onloadstart = actualOptions.loadstartEventHandler;
            xhr.upload.onprogress = actualOptions.progressEventHandler;
            return xhr;
            },
            data: blob,
            cache: false,
            processData: false
        });
    }
}
$( document ).ready(function() {
    preparePasteEvents()
});

