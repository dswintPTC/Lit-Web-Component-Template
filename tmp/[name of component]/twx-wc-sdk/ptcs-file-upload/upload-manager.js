export class UploadManager {
    constructor(url) {
        this.url = url;
        this.requestHeaders = [];
    }

    /*
     * I use XMLHttpRequest for sending upload request since "fetch" API doesn't support reporting loading progress
     */
    upload(file, opts = {}, onprogress, onstatuschange) {
        if (!file || !this.url) {
            return null;
        }

        var formData = new FormData();
        let actions = {};

        if (this.pathFormParm && opts.path) {
            formData.append(this.pathFormParm, opts.path);
        }

        if (this.repoFormParm && opts.repo) {
            formData.append(this.repoFormParm, opts.repo);
        }

        const filename = opts.filename || file.name;
        formData.set('file', file, filename);

        const xhr = new XMLHttpRequest();

        let uploadProgressEvent;

        if (typeof onprogress === 'function') {
            uploadProgressEvent = e => {
                onprogress({
                    progress: Math.floor((e.loaded / e.total) * 100),
                    fileName: filename
                });
            };
        }

        xhr.open('POST', this.url);

        xhr.upload.addEventListener('loadstart', uploadProgressEvent);
        xhr.upload.addEventListener('load', uploadProgressEvent);
        xhr.upload.addEventListener('loadend', uploadProgressEvent);
        xhr.upload.addEventListener('progress', uploadProgressEvent);
        // xhr.upload.addEventListener('error', handleEvent);
        // xhr.upload.addEventListener('abort', handleEvent);

        for (const rh of Object.keys(this.requestHeaders)) {
            xhr.setRequestHeader(rh, this.requestHeaders[rh]);
        }

        xhr.withCredentials = !!this.withCredentials;

        xhr.send(formData);

        if (typeof onstatuschange === 'function') {
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    onstatuschange({
                        status:   xhr.status,
                        fileName: filename
                    });
                }
            };
        }

        actions = {
            cancel: xhr.abort.bind(xhr)
        };

        return actions;
    }
}
