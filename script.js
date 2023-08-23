// #region ==================== APP

let fileInput           = $("#file");
let fileDropArea        = $(".file-drop-area");
let fileInputPreview    = $(".file-input-preview");
let dummyImageSrc       = fileInputPreview.attr("src");
let imageURLInput       = $("#image-url");
let imageURLErrors      = $("#image-url-errors");
let resetBtn            = $("#reset");
let base64Output        = $("#base64-output");
let base64OutputLength  = $("#base64-output-length");
let base64OutputTypeInputs = $("#base64-output-types .btn-check");
let copyBtn             = $("#copy");

resetBtn.click(() => resetUI(true, true));

fileInput.change(function () {
    resetUI(true);
    if (this.files.length) {
        convertAndPreview(this.files[0]);
    }
});

imageURLInput.on("input", () => {
    let url = imageURLInput.val();
    if (url.length != 0) {
        resetUI(false, true);
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                let downloadedFile = new File([blob], "download");
                convertAndPreview(downloadedFile);
            })
            .catch(error => {
                imageURLErrors.html(`
                    <div class="alert alert-danger alert-dismissible mb-0">
                        <span>${error.message}. Invalid URL, Not Found or blocked by CORS policy.</span>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `);
            });
    }
});

fileDropArea.on("click", () => fileInput.click());

fileDropArea
    .on("drag dragstart dragend dragover dragenter dragleave drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
    })
    .on("dragover dragenter", function () {
        fileDropArea.addClass("is-dragover");
    })
    .on("dragleave dragend drop", function () {
        fileDropArea.removeClass("is-dragover");
    })
    .on("drop", function (e) {
        convertAndPreview(e.originalEvent.dataTransfer.files[0]);
    });

$(window).on("paste", function(e) {
    if (e.originalEvent.clipboardData.files.length) {
        e.preventDefault();
        resetUI(true, true);
        convertAndPreview(e.originalEvent.clipboardData.files[0]);
    }
});

base64OutputTypeInputs.change(function (e) {
    if (this.checked) {
        const base64 = fileInputPreview.attr("src");
        if (base64 === dummyImageSrc) return;
        updateBase64Output(
            formatBase64(base64, getSelectedOutputType())
        );
    }
});

copyBtn.on("click", () => navigator.clipboard.writeText(base64Output.val()));

// #endregion

// #region ==================== FUNCTIONS

function resetUI(clearURL = false, clearFile = false) {
    fileDropArea.removeClass("preview-loading");
    fileDropArea.removeClass("preview-loaded");
    fileInputPreview.attr("src", dummyImageSrc);
    if (clearURL) imageURLInput.val(null);
    imageURLErrors.html(null);
    base64Output.val(null);
    base64OutputLength.text("0 chars");
    if (clearFile) {
        fileInput.val(null);
    }
}

function convertAndPreview(file) {
    fileDropArea.addClass("preview-loading");
    convertFile2Base64(file, (base64) => {
        fileInputPreview.one("load", () => {
            setTimeout(() => {
                fileDropArea.removeClass("preview-loading");
                fileDropArea.addClass("preview-loaded");
            });
        })
        fileInputPreview.attr("src", base64);
        updateBase64Output(
            formatBase64(base64, getSelectedOutputType())
        );
    });
}

function convertFile2Base64(file, callback) {
    let reader = new FileReader();
    reader.onloadend = function () {
        callback(reader.result);
    };
    reader.readAsDataURL(file);
}

function updateBase64Output(base64) {
    base64Output.val(base64);
    base64OutputLength.text(base64.length.toLocaleString() + " chars");
}

function formatBase64(base64, type) {
    switch (type) {
        case 'text':
            return base64;
        case 'img':
            return `<img alt="" src="${base64}" />`;
        case 'md':
            return `![](${base64})`;
        default:
            console.error("Unexpected output type: " + type);
    }
}

function getSelectedOutputType() {
    const inputId = base64OutputTypeInputs.filter(":checked").attr('id');
    const outputType = inputId.replace('base64-output-type-', '');
    return outputType;
}

// #endregion
