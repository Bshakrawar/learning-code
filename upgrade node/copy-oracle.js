import { api, LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
import getCalloutParams from '@salesforce/apex/CM_OracleVisualisation.getCalloutParams';

const CONTEXT_THREADS = "Threads";
const CONTEXT_ATTACHMENTS = "Attachments";
const CONTEXT_ATTACHMENT_DATA = "AttachmentData";
const CONTEXT_ENQUIRIES = "Enquiries";

// https://www.lightningdesignsystem.com/icons/#doctype
const ICON_MAP = {
    "ai":"doctype:ai",
    // "":"doctype:attachment",
    "audio":"doctype:audio",
    // "":"doctype:box_notes",
    "text/csv":"doctype:csv",
    "eps":"doctype:eps",
    "xls":"doctype:excel",
    "xlsx":"doctype:excel",
    "exe":"doctype:exe",
    // "":"doctype:flash",
    // "":"doctype:folder",
    // "":"doctype:gdoc",
    // "":"doctype:gdocs",
    // "":"doctype:gform",
    // "":"doctype:gpres",
    // "":"doctype:gsheet",
    "html":"doctype:html",
    "htm":"doctype:html",
    "image":"doctype:image",        // for image category
    // "":"doctype:keynote",
    // "":"doctype:library_folder",
    // "":"doctype:link",
    "mp4":"doctype:mp4",
    // "":"doctype:overlay",
    // "":"doctype:pack",
    // "":"doctype:pages",
    "application/pdf":"doctype:pdf",
    "ppt":"doctype:ppt",
    "pptx":"doctype:ppt",
    "psd":"doctype:psd",
    // "":"doctype:quip_doc",
    // "":"doctype:quip_sheet",
    // "":"doctype:quip_slide",
    "text/rtf":"doctype:rtf",
    // "":"doctype:slide",
    // "":"doctype:stypi",
    "text/plain":"doctype:txt",
    "*":"doctype:unknown",      // fallback
    "video":"doctype:video",        // for video category
    "vsdx":"doctype:visio",
    "vdx":"doctype:visio",
    // "":"doctype:webex",
    "doc":"doctype:word",
    "docx":"doctype:word",
    "application/xml":"doctype:xml",
    "application/zip":"doctype:zip",
}
// REF: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
const EXT_MIME_MAP = {
    aac:"audio/aac",
    abw:"application/x-abiword",
    arc:"application/x-freearc",
    avif:"image/avif",
    avi:"video/x-msvideo",
    azw:"application/vnd.amazon.ebook",
    bin:"application/octet-stream",
    bmp:"image/bmp",
    bz:"application/x-bzip",
    bz2:"application/x-bzip2",
    cda:"application/x-cdf",
    csh:"application/x-csh",
    css:"text/css",
    csv:"text/csv",
    doc:"application/msword",
    docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    eot:"application/vnd.ms-fontobject",
    epub:"application/epub+zip",
    gz:"application/gzip",
    gif:"image/gif",
    htm:"text/html",
    html:"text/html",
    ico:"image/vnd.microsoft.icon",
    ics:"text/calendar",
    jar:"application/java-archive",
    jpeg:"image/jpeg",
    jpg:"image/jpeg",
    js:"text/javascript",
    json:"application/json",
    jsonld:"application/ld+json",
    mid:"audio/midi",
    midi:"audio/midi",
    mjs:"text/javascript",
    mp3:"audio/mpeg",
    mp4:"video/mp4",
    mpeg:"video/mpeg",
    mpkg:"application/vnd.apple.installer+xml",
    odp:"application/vnd.oasis.opendocument.presentation",
    ods:"application/vnd.oasis.opendocument.spreadsheet",
    odt:"application/vnd.oasis.opendocument.text",
    oga:"audio/ogg",
    ogv:"video/ogg",
    ogx:"application/ogg",
    opus:"audio/opus",
    otf:"font/otf",
    png:"image/png",
    pdf:"application/pdf",
    php:"application/x-httpd-php",
    ppt:"application/vnd.ms-powerpoint",
    pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
    rar:"application/vnd.rar",
    rtf:"application/rtf",
    sh:"application/x-sh",
    svg:"image/svg+xml",
    swf:"application/x-shockwave-flash",
    tar:"application/x-tar",
    tif:"image/tiff",
    tiff:"image/tiff",
    ts:"video/mp2t",
    ttf:"font/ttf",
    txt:"text/plain",
    vsd:"application/vnd.visio",
    wav:"audio/wav",
    weba:"audio/webm",
    webm:"video/webm",
    webp:"image/webp",
    woff:"font/woff",
    woff2:"font/woff2",
    xhtml:"application/xhtml+xml",
    xls:"application/vnd.ms-excel",
    xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xml:"application/xml",
    xul:"application/vnd.mozilla.xul+xml",
    zip:"application/zip",
    "7z":"application/x-7z-compressed"
};
// TODO: finalise file types
const PREVIEW_FILE_TYPES = ["application/pdf", "text/plain", "image/png", "image/jpeg", "image/x-png"];

const ERROR_MSG_GENERIC = 'We encountered an error, please try again';

const MAX_CALLS_PER_TRANS = 10;     // the limit of calls per transaction (to avoid infinite callouts caused by bug)

// Keywords used to exclude threads/attachments
const SALESFORCE_THREAD_KEYWORD = 'Populated by Salesforce Integration';
const SALESFORCE_ATTACHMENT_KEYWORD = 'Populated by Salesforce Integration';

export default class OracleList extends LightningElement {
    @api recordId;              // case record id
    @api maxHeight = "500px";   // max height of the accordion, configurable via UI

    // the style of the thread/attachment list
    get accordionStyle() {return this.total > 0 ? `width: 100%; overflow: auto; height: ${this.maxHeight};` : `width: 100%; overflow: auto;`}

    @api context = CONTEXT_ATTACHMENTS;
    get isThreadList()      {return this.context == CONTEXT_THREADS};
    get isAttachmentList()  {return this.context == CONTEXT_ATTACHMENTS;}
    get toastTitle()        {return `Oracle CRM - ${this.context}`};
    get noRecordsFoundMsg() {return `No ${this.context} found.`};

    @api previewableMimeTypes = "";
    get previewableMimeTypeList() {return this.previewableMimeTypes.split(";")};

    isLoading = false;  // control the appearance of spinner

    inited = false;     // avoid recursive initialisation

    page = 1;           // page starts at 1
    @api pageSize = 10; // page size, configurable via UI
    total = 999;        // initialise total with non-zero figure to suppress 'No records found' message.

    // page size per API Call, introduced to retrieve more unfiltered records
    get pageSizePerCall() { return this.pageSize*2; }

    // check whether API call has reached the last page
    get isLastPage() { return this.total <= (this.page-1)*this.pageSizePerCall;}

    // to disable Load more button when no record returned or is last page and all buffer has been loaded
    get loadMoreDisabled() {return this.total == 0 || ( this.isLastPage && this.buffer.length == 0);}

    errorMsg;

    resourceBaseUrl;
    resourceAuthHeader;
    incidentId;
    token;
    tokenExpiry;
    callCount = 0;


    // attachment preview related
    previewSrc;             // the src for iframe/img
    isImg = false;          // suggest which element to use, iframe or img
    imgWidth = 0;           // image width used to calculate the style of the image
    imgHeight = 0;          // image height used to calculate the style of the image
    windowHeight = 0;
    windowWidth = 0;
    get iframeStyle() {
        let w = 80;
        return `position: absolute; left: ${(100-w)/2}%; width: ${w}%; height: 100%; background-color: white;`;
    }
    get previewImgStyle() {
        // in case image height/width > window
        if(this.imgHeight > this.windowHeight || this.imgWidth > this.windowWidth) {
            if(this.imgHeight/this.windowHeight > this.imgWidth/this.windowWidth) {
                this.imgWidth *= this.windowHeight/this.imgHeight;
                this.imgHeight = this.windowHeight;
            } else {
                this.imgHeight *= this.windowWidth/this.imgWidth;
                this.imgWidth = this.windowWidth;
            }
        }
        return `background: white; position: absolute; top: ${(this.windowHeight - this.imgHeight)/2}px; left: ${(this.windowWidth - this.imgWidth)/2}px; width: ${this.imgWidth}px; height: ${this.imgHeight}px;`
    }
    isModalOpen = false;

    @track data = [];

    buffer = [];            // callout -> buffer first -> data (pagination within LWC)

    @api debug = false;     // if set to true, there will be lots of console.log'

    inMemoryStore = {};//Ren

    connectedCallback() {
        if(this.inited == false) {
            this.inited = true;
            // load first batch of data
            this.loadData({getIncidentMeta: true, context: this.context});
            // listen to window resize event (Attachments context only)
            if(this.context == CONTEXT_ATTACHMENTS) {
                this.windowHeight = window.innerHeight;
                this.windowWidth = window.innerWidth;
                window.addEventListener('resize', this.handleWindowResize.bind(this));
            }
        }
    }



    /**
     *
     */
    handleLoadMoreClick() {
        this.callCount = 0;
        this.loadData({getIncidentMeta: false, context: this.context});
    }

    /**
     *
     * @param {object} event click event
     */
    handleAttachmentClick(event) {
        // console.log(`event.target.dataset: ` + event.target.dataset.id);
        this.callCount = 0;
        const attachmentId = event.target.dataset.id;
        this.selectedAttachment = this.data.find(row => row.AttachmentId == attachmentId);
        if(this.debug) {console.log('selected attachment: ' + JSON.stringify(this.selectedAttachment));}
        this.loadData({getIncidentMeta: false, context: CONTEXT_ATTACHMENT_DATA, attachmentId: attachmentId});
    }


    handleCloseModalClick() {
        this.isModalOpen = false;
    }

    handleWindowResize() {
        // preview iframe/img style will be recalculated based on new window dimensions
        if(window.innerHeight != this.windowHeight) {
            this.windowHeight = window.innerHeight;
        }
        if(window.innerWidth != this.windowWidth) {
            this.windowWidth = window.innerWidth;
        }
    }

    /**
     * Load metadata (optional) via Apex as well as data via direct Integration
     * @param {object} param0
     */
     async loadData({
        getIncidentMeta,
        context,
        attachmentId
    }) {
        // apex call to get resource endpoint, credentials, token (optional)
        try {
            this.errorMsg = '';
            this.isLoading = true;
            // check local storage for existing token
            let params = {recordId: this.recordId, requestNewToken: true, getIncidentMeta: getIncidentMeta};
            let sessionInfo = this.retrieveDataHubSessionInfo(USER_ID);
            if(sessionInfo && sessionInfo.token) {
                this.token = sessionInfo.token;
                this.tokenExpiry = sessionInfo.expiry;
                params.requestNewToken = false;
            }
            console.log('params: ' + JSON.stringify(params));//Ren
            if(this.debug) {console.log('params: ' + JSON.stringify(params));}
            console.log('requestNewToken:', params.requestNewToken, typeof params.requestNewToken);//Ren
            console.log('getIncidentMeta:', params.getIncidentMeta, typeof params.getIncidentMeta);//Ren

            const condition = params.requestNewToken === true || params.getIncidentMeta === true;
            console.log('Overall condition evaluates to:', condition);


            // invoke apex method only when needed (i.e. token expired, incident metadata not initialised)
            if(params.requestNewToken === true || params.getIncidentMeta === true) {
                console.log('params.requestNewToken ||params.getIncidentMeta === true');//ren
                let initResultJson = await getCalloutParams(params);
                console.log('initResultJson: '+ JSON.stringify(initResultJson));//ren
                if(this.debug) {console.log('getCalloutParams response: ');}
                if(this.debug) {console.log(initResultJson);}
                this.initVariables(initResultJson);
            }

            // fetch data only when the incident id is present
            if(this.incidentId) {

                // for threads & attachments (excluding the attachment data)
                // check buffer first
                if(
                    (
                        context == CONTEXT_THREADS
                        || context == CONTEXT_ATTACHMENTS
                    )
                    &&
                    (
                        this.buffer.length >= this.pageSize
                        || this.isLastPage
                        || this.callCount == MAX_CALLS_PER_TRANS
                    )
                ) {
                    this.data = this.data.concat(this.buffer.slice(0, this.pageSize));
                    this.buffer = this.buffer.slice(this.pageSize);
                    if(this.debug) {console.log(`buffer has sufficient ${context} data:`, '\n', `new data length: ${this.data.length}`, '\n', `new buffer length: ${this.buffer.length}`);}
                    this.isLoading = false;

                    this.total = (this.isLastPage) ? this.data.length : this.total;
                    return;
                }

                let resourceResp = await this.retrieveResource(
                    this.getFetchUrl(context, this.resourceBaseUrl, this.incidentId, attachmentId, this.page, this.pageSizePerCall),
                    this.token,
                    this.resourceAuthHeader);

                if(context == CONTEXT_THREADS || context == CONTEXT_ATTACHMENTS) {
                    await this.parseFetchedListResponse(resourceResp);
                } else if(context == CONTEXT_ATTACHMENT_DATA) {
                    await this.parseFetchedSingleAttachmentResponse(resourceResp);
                }
            } else {
                this.total = 0;
            }

            this.isLoading = false;

        } catch (error) {
            // this message should show regardless the debug mode
            console.log('loadData error: ' + error.message);
            // show toast
            this.dispatchEvent(new ShowToastEvent({title: this.toastTitle, variant: 'Error', message: ERROR_MSG_GENERIC}));
            this.isLoading = false;
            this.errorMsg = ERROR_MSG_GENERIC;
        }
    }

    /**
     *
     * @param {object} result
     */
    initVariables(result) {
        // store endpoint, etc.
        console.log('inside the store token initVariables' + JSON.stringify(result) + 'result.incidentId' + result.incidentId);//ren
        if(result.resourceEndpoint) {
            // console.log('initiating endpoint, etc.');
            this.incidentId = result.incidentId;
            this.resourceBaseUrl = result.resourceEndpoint;
            this.resourceAuthHeader = result.resourceAuthHeader;

        }

        // store token
        if(result.token && result.expiresInSeconds) {
            console.log('inside the store token initVariables');//ren
            this.token = result.token;
            console.log('USER_ID: '+ USER_ID + 'result.token' + result.token + 'result.expiresInSeconds' + result.expiresInSeconds);//ren
            this.storeDataHubSessionInfo(USER_ID, result.token, result.expiresInSeconds);
        }

        // console.log('variable initiated...');

    }

    /**
     *
     * @param {string} endpoint
     * @param {string} token
     * @param {string} oracleAuth
     * @param {integer} page
     * @param {integer} pageSize
     * @returns {object}
     */
    async retrieveResource(url, token, oracleAuth) {
        try {
            if(this.debug) {
                console.log('Resource url: ' + url);
                console.log(`Bearer ${token}`);
                console.log(`Basic ${oracleAuth}`);
                console.log(`Callout Count/Limit: ${this.callCount + 1}/${MAX_CALLS_PER_TRANS}`);
            }

            // if call count goes above max allowed, skip the fetch
            if(this.callCount >= MAX_CALLS_PER_TRANS) {
                console.log(`${MAX_CALLS_PER_TRANS} callouts have been made in the current transaction, aborting subsequent callouts.`);
                return {};
            }
            this.callCount ++;

            // // resource callout
            let response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "SERVICECRM-Authorization": `Basic ${oracleAuth}`
                }
            });

            if(!response.ok) {
                let errorJson = await response.json();
                throw new Error(`${errorJson.errorMessage} [statusCode = ${response.status}]`);
            }
            return await response.json();
        } catch(error) {
            throw new Error('Unable to retrieve ' + this.context + ' due to ' + error.message);
        }
    }

    /**
     *
     * @param {object} response the response JSON from the fetch, which contains list of threads/attachments
     */
    async parseFetchedListResponse(response) {
        // console.log('parsing fetched response');
        // happy path
        if(response) {
            // parse count
            this.total = response._total;
            // No result found
            if(this.total == 0) {
                return;
            }
            this.page = this.page + 1;
            if(this.debug) {
                console.log('total:' + this.total);
                console.log('nextPage:' + this.page);
                console.log('pageSize:' + this.pageSizePerCall);
            }

            // parse thread / attachment data
            // make them following the data structure prescribed by relevant child LWCs
            if(this.isThreadList && response.enquiry_threads) {
                // threads
                for(let thread of response.enquiry_threads) {
                    if(this.debug) {console.log(thread);}
                    // skip certain threads
                    // TODO: pending Integration provide mailHeader in API
                    if(thread.thread_mail_header && thread.thread_mail_header.includes(SALESFORCE_THREAD_KEYWORD)) continue;

                    let t = {
                        id: thread.thread_id.toString(),
                        type: (thread.entry_type == "Note") ? "Note" : "Email",
                        subTitle: "",
                        subTitleIcon: (thread.entry_type == "Note") ? "standard:note" : "standard:email",
                        isOpen: false,
                        sectionClass: "slds-accordion__section",
                        body: thread.thread_text,
                        timestamp: thread.created_timestamp,
                    };
                    t.bodyExtract = this.extractTextFromHtml(t.body).substring(0, 200);
                    t.subTitle = t.bodyExtract;
                    if(thread.sender_details) {
                        let sender = thread.sender_details;
                        if(sender.account) {
                            t.sender = sender.account.account_name ? sender.account.account_name : "";
                        }
                        if(sender.contact) {
                            t.sender = sender.contact.contact_name ? sender.contact.contact_name : "";
                            t.senderEmail = sender.contact.contact_email_address ? sender.contact.contact_email_address : "";
                        }
                    }
                    // push to buffer first (conditional)
                    this.buffer.push(t);
                }
            } else if(this.isAttachmentList && response.enquiry_attachments) {
                // attachments
                for(let attachment of response.enquiry_attachments) {
                    if(this.debug) {console.log(attachment);}
                    // skip certain attachments
                    // TODO: pending Integration provide description in API
                    if(attachment.file_description && attachment.file_description.includes(SALESFORCE_ATTACHMENT_KEYWORD)) continue;
                    let a = {
                        id: attachment.file_attachment_id.toString(),
                        Name: attachment.file_name,
                        AttachmentId: attachment.file_attachment_id,
                        CreatedDateTime: attachment.created_timestamp,
                        file_content_type: attachment.file_content_type,
                        file_size: attachment.file_size,
                        Type: attachment.file_content_type
                    };
                    a.SizeKB = (a.file_size/1024).toFixed(0) + "KB";
                    a.Type = this.getContentType(a.Type, a.Name);
                    a.Icon = this.getIcon(a.Type, a.Name);
                    // push to buffer first (conditional)
                    this.buffer.push(a);
                }
            }

            // load data again (buffer will be checked in there)
            this.loadData({getIncidentMeta: false, context: this.context});
        }
    }

    /**
     *
     * @param {object} response
     */
    async parseFetchedSingleAttachmentResponse(response) {
        console.log(response);

        this.isImg = false;
        // optional: map to known data struct

        // depending on the MediaType / MIME Content Type, download / preview the file
        const contentType = this.selectedAttachment.Type;
        const fileName = this.selectedAttachment.Name;
        if(response && response.data) {
            if(PREVIEW_FILE_TYPES.includes(contentType) || this.previewableMimeTypeList.includes(contentType)) {
                this.previewSrc = await this.createURL(response.data, contentType);
                // image will be shown with <img>
                if(contentType.split("/")[0] == "image") {
                    // console.log('processing image');
                    let dimensions = await this.getImageDimensions(this.previewSrc);
                    // console.log(dimensions);
                    if(dimensions && dimensions.w && dimensions.h) {
                        this.isImg = true;
                        this.imgWidth = dimensions.w;
                        this.imgHeight = dimensions.h;
                    }
                }
                // open modal
                this.isModalOpen = true;
            } else {
                this.downloadBase64File(contentType, response.data, fileName);
            }
        }
    }

    /**
     * Create an URL out of the Base64 string
     * @param {string} base64
     * @param {string} type
     * @returns
     */
    async createURL(base64, type) {
        let objectURL = URL.createObjectURL(this.base64toBlob(base64, type));
        return objectURL;
    }

    /**
     * Convert Base64 string to a Blob
     * @param {string} base64
     * @param {string} type
     * @returns
     */
    base64toBlob(base64, type) {
        // ref: https://github.com/nagensahu/Base64toBlobtoDownload/blob/master/Aura/Download/DownloadHelper.js
        // ref: https://stackoverflow.com/questions/27980612/converting-base64-to-blob-in-javascript

        let byteCharacters = atob(base64);
        const buf = new Array(byteCharacters.length);
        for (let i = 0; i != byteCharacters.length; ++i) buf[i] = byteCharacters.charCodeAt(i);// & 0xFF;
        const view = new Uint8Array(buf);
        const blob = new Blob([view], {type: type});
        return blob;
    }

    /**
     *
     * @param {string} contentType
     * @param {string} base64Data
     * @param {string} fileName
     */
    downloadBase64File(contentType, base64Data, fileName) {
        const linkSource = `data:${contentType};base64,${base64Data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
   }

    /**
     *
     * @param {string} src The url of the image
     * @returns
     */
    async getImageDimensions(src) {
        return new Promise (function (resolved, rejected) {
            let i = new Image();
            i.onload = function(){
                console.log('in image onload');
                resolved({w: i.width, h: i.height})
            };
            i.src = src;
        })
    }

    /**
     *
     * @param {string} userId 15/18char user id from SF
     * @param {string} token access_token issued by DataHub Auth
     * @param {integer} expiry expiry time in seconds
     */
    storeDataHubSessionInfo(userId, token, expiry) {
        console.log('storing session info');//ren
        localStorage.setItem(`DataHub_${userId}_token`, token);
        localStorage.setItem(`DataHub_${userId}_expiry`, Date.now() + expiry * 1000);
    }

    /**
     * Securely retrieve DataHub session info from localStorage
     * @param {string} userId
     * @returns {object} {token: ..., expiry: ...}
     */
    retrieveDataHubSessionInfo(userId) {
        console.log(`retrieveDataHubSessionInfo for userId: ${userId}`); //ren
        if(this.debug) {console.log(`retrieveDataHubSessionInfo for userId: ${userId}`);}
        // get token out of localStorage
        let token = localStorage.getItem(`DataHub_${userId}_token`);
        let expiry = localStorage.getItem(`DataHub_${userId}_expiry`);

        // Validate token: only allow alphanumeric, dash, underscore, dot
        if (typeof token !== 'string' || /[^a-zA-Z0-9-_.]/.test(token)) {
            console.warn('Invalid token format detected, ignoring token.');
            token = undefined;
        }
        // Validate expiry: must be a number and in the future
        if (isNaN(expiry) || Number(expiry) <= Date.now()) {
            expiry = undefined;
        }

        console.log(`trying to get: ${token} with expiry ${expiry}`);//ren
        if(this.debug) {console.log(`trying to get: ${token} with expiry ${expiry}`);}

        if(token && expiry) {
            return {token: token, expiry: expiry};
        }
        console.log(`inside retrievedatahubs: ` + token + ' expiry: ' + expiry);//ren
        return {token: undefined, expiry: undefined};
    }


    /**
     *
     * @param {string} html
     * @returns {string} text content of the html
     */
    extractTextFromHtml(html) {
        return new DOMParser().parseFromString(html, "text/html").documentElement.textContent;
    }

    /**
     *
     * @param {string} context
     * @param {string} baseUrl
     * @param {string} incidentId
     * @param {string} attachmentId
     * @param {integer} page
     * @param {integer} pageSize
     * @returns
     */
    getFetchUrl(context, baseUrl, incidentId, attachmentId, page, pageSize) {
        if(context == CONTEXT_THREADS) return baseUrl + '/' + incidentId + '/threads' + (page ? `?page=${page}&page_size=${pageSize}` : '');
        if(context == CONTEXT_ATTACHMENTS) return baseUrl + '/' + incidentId + '/attachments' + (page ? `?page=${page}&page_size=${pageSize}` : '');
        if(context == CONTEXT_ATTACHMENT_DATA) return baseUrl + '/' + incidentId + '/attachments/' + attachmentId + '/data';
        if(context == CONTEXT_ENQUIRIES) return baseUrl + '/' + incidentId;
    }

    /**
     *
     * @param {string} contentType
     * @param {string} fileName
     * @returns
     */
    getIcon(contentType, fileName) {
        try {
            if(ICON_MAP.hasOwnProperty(contentType)) {
                return ICON_MAP[contentType];
            }
            // get the extension
            let ext = fileName.split('.').pop();
            if(ICON_MAP.hasOwnProperty(ext)) {
                return ICON_MAP[ext];
            }
            // get the first part of the contentType
            let type = contentType.split('/')[0];
            if(ICON_MAP.hasOwnProperty(type)) {
                return ICON_MAP[type];
            }
        } catch(error) {
            console.log(`getIcon error: ${error.message}`);
        }
        return ICON_MAP["*"];
    }

    /**
     *
     * @param {string} contentType
     * @param {string} fileName
     * @returns
     */
    getContentType(contentType, fileName) {
        if(contentType != 'application/octet-stream') {
            return contentType;
        }

        try {
            // get the extension
            let ext = fileName.split('.').pop();
            if(EXT_MIME_MAP.hasOwnProperty(ext)) {
                return EXT_MIME_MAP[ext];
            }
        } catch(error) {
            console.log(`getContentType error: ${error.message}`);
        }
        return contentType;
    }
}