jQuery.event.props.push('clipboardData');
jQuery.event.props.push('dataTransfer');
(function ($) {
    var imgpaste = {};

    // Override attachments.js uploadBlob
    window.uploadBlob = function (blob, uploadUrl, attachmentId, options) {
        var actualOptions = $.extend({
            loadstartEventHandler: $.noop,
            progressEventHandler: $.noop
        }, options);

        uploadUrl = uploadUrl + '?attachment_id=' + attachmentId;
        if (blob instanceof window.File || blob.name) {
            uploadUrl += '&filename=' + encodeURIComponent(blob.name);
            uploadUrl += '&content_type=' + encodeURIComponent(blob.type);
        }

        return $.ajax(uploadUrl, {
            type: 'POST',
            contentType: 'application/octet-stream',
            beforeSend: function(jqXhr, settings) {
                jqXhr.setRequestHeader('Accept', 'application/js');
                // attach proper File object
                settings.data = blob;
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

    function getExtension(type) {
        /* Get file name and type details */
        var ext = '';
        switch (type)
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
            case 'image/x-bmp':
            case 'image/x-ms-bmp':
                ext = '.bmp';
                break;
        }
        return ext;
    }

    imgpaste.context = {
        init: function () {
            this.initClipboardEvents();
        },

        isBrowserSupported: function () {
            var M = navigator.userAgent.match(/(firefox|webkit|trident)\/?\s*(\.?\d+(\.\d+)*)/i);
            if (M) {
                var browserMajor = parseInt(M[2], 10);
                M[1] = M[1].toLowerCase();

                var isCompatChrome = (M[1] === 'webkit' && typeof window.chrome === "object" && browserMajor >= 535);
                hasClipboard = isCompatChrome;

                if (isCompatChrome ||
                    (M[1] === 'firefox' && browserMajor >= 3) ||
                    (M[1] === 'trident' && browserMajor >= 7))
                    return true;
            }
            return false;
        },

        showSupportedBrowsers: function () {
            alert("Please use latest Firefox or Chrome to paste images from clipboard.");
        },

        /**
         * Inits the clipboard evetns for editors on the page.
         */
        initClipboardEvents: function(){
            var self = this;

            // - creates a capture to insert images from clipboards

            // fake editable content
            this.createPasteCapture();

            // focuses on the fake editable content when ctrl+v is pressed
            this.preventPaste = function() {
                if (!document.activeElement) return;

                // we can insert images only into wp editor
                if ( !$(document.activeElement).is(".wiki-edit") ) return;

                self.saveCurrentSelection();
                $("#paster").css('top', window.pageYOffset + 20).focus();
            }

            var vKey = 86;

            $(document).keydown(function(e){
                if ( (e.ctrlKey || e.metaKey) && !e.altKey && e.keyCode == vKey ) {
                    if ( !self.isBrowserSupported() ) {
                        return;
                    }
                    self.preventPaste();
                };
            });

            // catchs the "paste" event to upload image on a server
            $(document).on('paste', '.wiki-edit, #paster', function (e) {
                // we can insert images only into wp editor or editable content
                if (!document.activeElement ||
                    (!$(document.activeElement).is('.wiki-edit') &&
                    !$(document.activeElement).attr('contenteditable')))
                {
                    return;
                }

                if (!self.selection) { self.saveCurrentSelection(); }
                if ( e.clipboardData && e.clipboardData.items)  {
                    self.uploadFromClipboard(e);
                } else if (self.isBrowserSupported()) {
                    self.uploadFromCapture();
                } else if (e.clipboardData) {
                    self.getDataItems(e.clipboardData, self.selection.editor, e)
                }
            });

            $('.wiki-edit').on('drop', function(e) {
                self.saveCurrentSelection();
                var files = e.dataTransfer.files;

                for (var i = 0; i < files.length; i++) {
                    var file = files[i];

                    if (file.type.indexOf('image/') < 0) { continue }

                    var blob = file.slice();
                    self.uploadImage(file.type, blob, this, file.name.replace(/[ !"#%&\'()*:<=>?\[\\\]|]/g, '_'));

                    e.preventDefault();
                    e.stopPropagation();
                    break;
                }
            });
        },

        // --------------------------------------------------------------------------
        // Methods for uploading
        // --------------------------------------------------------------------------

        uploadImage: function(type, blob, editElement, filename) {
            var ext = (typeof filename === 'undefined') ? getExtension(type) : ('_' + filename);
            var fileinput = $('.file_selector').get(0);
            var timestamp = Math.round(+new Date()/1000);
            var name = 'screenshot_'+addFile.nextAttachmentId+'_'+timestamp+ext;

            /* Upload pasted image */
            if (Object.defineProperty) {
                Object.defineProperty(blob, 'name', { value: name });
            } else {
                blob.name = name;
            }
            uploadAndAttachFiles([blob], fileinput);

            /* Inset text into input */
            this.pasteImageName(editElement, name);
        },

        processClipboardItems: function(clipboardData, editElement, event) {
            for (var i = 0; i<clipboardData.items.length; i++)
            {
                var file = clipboardData.items[i];
                if (file.type.indexOf('image/') != -1)
                {
                    this.uploadImage(file.type, file.getAsFile(), editElement);
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                }

            }
        },

        /**
        * Some browser doesn't support cliboardData.items, so this function recreates a simpler version of it
        * by getting the blob linked to the image.
        * Currently only works when copying an image from a webpage
        */
        getDataItems: function(clipboardData, editElement, event) {
            if (!clipboardData.types) return;
            var self = this;

            clipboardData.items = [];
            for (var i = 0; i < clipboardData.types.length; i++) {
                console.log(clipboardData.types[i]);
                var data = clipboardData.getData(clipboardData.types[i]);
                if (clipboardData.types[i] == "text/html") {
                    var nodes = $(data);
                    $(data).each(function(j, node) {
                        var item = {};
                        if (node.tagName !== 'IMG') return;

                        var xhr = new XMLHttpRequest();
                        xhr.addEventListener('load', function(){
                            if (xhr.status !== 200) return;

                            //Do something with xhr.response (not responseText), which should be a Blob
                            item.getAsFile = function() {
                                return xhr.response;
                            }
                            item.type = xhr.response.type;
                            clipboardData.items.push(item);
                            self.processClipboardItems(clipboardData, editElement, event);
                        });
                        xhr.open('GET', node.src);
                        xhr.responseType = 'blob';
                        xhr.send(null);
                    });
                }
                else if (clipboardData.types[i] == "text/plain") {
                    var file_regexp = /file:\/\/.*/;
                    var regexp = new RegExp(file_regexp);
                    if (data.match(regexp)) {
                        alert('Your browser does not support pasting images from disk. Please use the upload form.');
                    }
                }
            }
        },

        /**
         * Uploads image by using Clipboard API. (firefox | opera | chrome)
         */
        uploadFromClipboard: function(e, options) {
            var self = this;

            // if the image is inserted into the textarea, then return focus
            self.returnFocusForTextArea();
            var items = $.makeArray(e.clipboardData.items).concat($.makeArray(e.clipboardData.files));

            // read data from the clipboard and upload the first file
            for (var i = 0; i < items.length; ++i) {
                if ((!items[i].kind || items[i].kind === 'file') && items[i].type.indexOf('image/') !== -1) {

                    // only paste 1 image at a time
                    e.preventDefault();

                    // uploads image on a server
                    var image = items[i].getAsFile ? items[i].getAsFile() : items[i];
                    this.uploadImage(items[i].type, image, this.selection.editor);
                    return;
                }
            }
            var items = e.clipboardData.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind === 'string' && items[i].type === 'text/plain') {
                    items[i].getAsString($.proxy(this.insertHtmlForTextarea, this));

                    e.preventDefault();

                    return;
                }
            }
        },

        b64toBlob: function(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {type: contentType});
            return blob;
        },


        /**
         * Uploads image by using the capture. (IE)
         */
        uploadFromCapture: function(options) {
            var self = this;

            var timeout = 5000, step = 100;
            $("#paster").html("");

            var timer = setInterval(function(){

                var html = $("#paster").html();

                // in nothing found, carry on to wait
                if ( html.length > 0 ) {
                    clearInterval(timer);

                    if ( html.indexOf("<img") == 0 ) {
                        var src = $("#paster img").attr('src');
                        var type = src.substring(src.indexOf(":") + 1, src.indexOf(";"))
                        var base64str = src.substr(src.indexOf(",") + 1);
                        self.uploadImage(type, self.b64toBlob(base64str, type), self.selection.editor);

                    } else {
                        function getInnerText(el) {
                            var sel, range, innerText = "";
                            if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
                                range = document.body.createTextRange();
                                range.moveToElementText(el);
                                innerText = range.text;
                            } else if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                                sel = window.getSelection();
                                sel.selectAllChildren(el);
                                innerText = "" + sel;
                                sel.removeAllRanges();
                            }
                            return innerText;
                        }
                        self.insertHtmlForTextarea(getInnerText($("#paster")[0]));
                    }

                } else {

                    timeout = timeout - step;
                    if ( timeout < 0 ) {
                        clearInterval(timer);
                    }
                    return;
                }

            }, 100);

            setTimeout(function(){
                self.returnFocusForTextArea();
            }, 500);
        },

        /**
         * Creates the capture.
         */
        createPasteCapture: function() {
            this.paster = $('<div id="paster"></div>')
                .attr({
                    'contenteditable': 'true',
                    '_moz_resizing': 'false'
                })
                .css({
                    'position': 'absolute',
                    'height': '1',
                    'width': '1',
                    'opacity': '0',
                    'outline': '0',
                    'overflow': 'auto',
                    'z-index': '-9999'
                })
                .prependTo('body');
        },

        // --------------------------------------------------------------------------
        // Methods for working with textarea
        // --------------------------------------------------------------------------

        /**
         * Returns a focus on the current editor textarea.
         */
        returnFocusForTextArea: function() {
            if ( !this.selection ) return;

            $(this.selection.editor).focus();
            this.selection.editor.selectionStart =  this.selection.start;
            this.selection.editor.selectionEnd = this.selection.end;
        },

        insertHtmlForTextarea: function(html) {
            if ( !this.selection ) return;

            var inserted = false;
            try {
                inserted = document.execCommand('insertText', false, html.replace(/\r\n/g, "\n"));
            } catch (e) {}
            if ( inserted ) return;

            this.selection.editor.value =
                this.selection.editor.value.slice(0, this.selection.start)
                + html
                + this.selection.editor.value.slice(this.selection.end);

            // $(this.selection.editor).focus();

            var elem = this.selection.editor;
            var caretPos = this.selection.start + html.length;
            if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            } else if(elem.selectionStart || elem.selectionStart === 0) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            } else {
                elem.focus();
            }
            this.selection = null;
        },

        pasteImageName: function(e, name) {
            var text = null;
            jsToolBar.prototype.elements.img.fn.wiki.call({
                encloseSelection: function(prefix, suffix, fn) {
                    text = prefix + name + suffix;
                }
            })
            this.insertHtmlForTextarea(text);
        },

        /**
         * Credits:
         * http://stackoverflow.com/questions/3964710/replacing-selected-text-in-the-textarea
         */
        getInputSelection: function(editor) {
            var start = 0, end = 0;

            if (typeof editor.selectionStart == "number" && typeof editor.selectionEnd == "number") {
                start = editor.selectionStart;
                end = editor.selectionEnd;
            }

            return {
                start: start,
                end: end,
                editor: editor
            };
        },

        saveCurrentSelection: function() {
            var self = this;

            if (!document.activeElement || !$(document.activeElement).is(".wiki-edit")) {
                var editor = self.contentWrap.find(".wiki-edit");
                this.selection = {
                    start: editor.val().length,
                    end: editor.val().length,
                    editor: editor[0]
                };
            } else {
                this.selection = this.getInputSelection(document.activeElement);
            }
        }
    };

    $(function() {
        imgpaste.context.init();
    });
})(jQuery);
