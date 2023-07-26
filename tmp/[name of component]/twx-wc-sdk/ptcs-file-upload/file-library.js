import mimesToExt from './mime-types-to-file-extension';

export function fileLabel(file, filename) {
    const GiB = 1073741824;
    const MiB = 1048576;
    const KiB = 1024;

    let fileSize = file.size;

    if (fileSize >= GiB) {
        fileSize = ' (' + (fileSize / GiB).toFixed(2) + 'GB)';
    } else if (fileSize >= MiB) {
        fileSize = ' (' + (fileSize / MiB).toFixed(2) + 'MB)';
    } else if (fileSize >= KiB) {
        fileSize = ' (' + (fileSize / KiB).toFixed(2) + 'KB)';
    } else {
        fileSize = ' (' + fileSize + 'B)';
    }

    return `${filename ? filename : file.name}${fileSize}`;
}

export function getFileType(file) {
    const filename = file.name;
    const lastDot = filename.lastIndexOf('.');

    if (lastDot !== -1) {
        return filename.substring(lastDot + 1);
    }

    return '';
}

export function parseAllowedFileTypes(fileTypes) {
    if (!fileTypes) {
        return null;
    }

    let result = '';

    fileTypes.split(',').forEach(type => {
        // Only alphanumeric is valid, can have spaces at the beginning/end and start with a single dot
        const isValid = /^[\s]*[.]{0,1}[a-zA-Z0-9]+[\s]*$/.test(type);
        if (isValid) {
            result += `.${type.replace(/[.\s]/g, '').toLowerCase()},`; // Add a dot prefix, remove spaces, and add a comma postfix
        }
    });

    return result.slice(0, -1);
}

export function isFileTypeAllowed(allowedTypes, type) {
    if (!type) {
        return null;
    }

    type = type.toLowerCase();

    if (!allowedTypes || allowedTypes.includes(type)) {
        return true;
    }

    if (mimesToExt.hasOwnProperty(type)) {
        for (const ext of mimesToExt[type]) {
            if (allowedTypes.includes(ext)) {
                return true;
            }
        }
    }

    return false;
}

export function allFilesInListAllowed(filesList, allowedTypes) {
    if (!allowedTypes) {
        return true;
    }

    for (const file of filesList) {
        if (!isFileTypeAllowed(allowedTypes, file.type)) {
            return false;
        }
    }

    return true;
}

export function getDraggedFiles(ev) {
    if (!ev.dataTransfer || (!ev.dataTransfer.files || !ev.dataTransfer.items)) {
        return null;
    }

    const files = {
        type: ev.dataTransfer.files.length ? 'files' : 'items',
        data: ev.dataTransfer.files.length ? ev.dataTransfer.files : ev.dataTransfer.items,
    };

    const res = [];

    for (const file of files.data) {
        res.push(file.getAsFile ? file.getAsFile() || file : file);
    }

    return res;
}

export function exceedMaxFileSize(filesList, maxFileSize) {
    for (const file of filesList) {
        if (file.file.size > Number(maxFileSize) * Math.pow(1024, 2)) {
            return true;
        }
    }
    return false;
}

export function openValidationDialog(dlgEl, titleText, messageText) {
    dlgEl.titleText = titleText;
    dlgEl.messageText = messageText;
    dlgEl.primaryActionLabel = 'OK';
    dlgEl.hideCancelAction = true;
    dlgEl.open();
}
