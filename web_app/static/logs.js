function actionFormatter (value,row,index) {
    
    return value
}

const createRinexBtnElt = document.getElementById('create-rinex-button');

window.operateEvents = {
    'click #log_delete': function (e, value, row, index) {
        document.querySelector('#filename').textContent = row.name;
        $('#deleteModal').modal();
        //put filename inside button attribute data.row to get it when the user
        // click on the confirm delete button.
        $('#confirm-delete-button').data.row = row;
        //document.getElementById("confirm-delete-button").dataset.row = row.name;
    },
    'click #log_edit': function(e, value, row, index) {
        document.querySelector('#filename').textContent = row.name;
        //console.log(row.format);
        if ( row.format.split(".").pop() === "ZIP") {
            createRinexBtnElt.removeAttribute('disabled');
        }
        else {
            createRinexBtnElt.setAttribute('disabled', '');
        }
        $('#editModal').modal();
        createRinexBtnElt.dataset.filename = row.name;
        //$('#rinex-create-button').data.row = row;
    }
};

$('#confirm-delete-button').on("click", function (){
    socket.emit("delete log", $('#confirm-delete-button').data.row);
});

createRinexBtnElt.onclick = function (){
    socket.emit("rinex conversion", {"filename": createRinexBtnElt.dataset.filename, "rinex-preset" : document.querySelector("#editModal a.active").dataset.rinexPreset});
    $(this).html('<span class="spinner-border spinner-border-sm"></span> Creating Rinex...');
    // Cleaning messages if previous conversion failed
    document.getElementById("rinex-conversion-msg").replaceChildren();
};

$(document).ready(function () {

    // SocketIO namespace:
    namespace = "/test";

    // initiate SocketIO connection
    socket = io.connect(namespace);

    // say hello on connect
    socket.on("connect", function () {
        socket.emit("browser connected", {data: "I'm connected"});
    });

    //console.log("log.js Asking for the available logs");
    socket.emit("get logs list");

    socket.on('disconnect', function(){
        console.log('disconnected');
    });

    //Clean edit modal content when closing it
    $("#editModal").on('hidden.bs.modal', function(){
        socket.emit("get logs list");
        var failedTitleElt = document.getElementById("failed_title");
        if (failedTitleElt != null) {
            failedTitleElt.remove();
        };
        var failedMsgElt = document.getElementById("failed_msg");
        if (failedMsgElt != null) {
            failedMsgElt.remove();
        };
        document.getElementById("rinex-conversion-msg").replaceChildren();
        $('#create-rinex-button').html('Create Rinex file');
      });

       // ################" TABLE ##########################"

    socket.on('available logs', function(msg){
        //console.log("New log list available");
        
        var actionDownloadElt = document.createElement("a");
        actionDownloadElt.href = "#";
        actionDownloadElt.setAttribute("title", "download");
        actionDownloadElt.setAttribute("id", "log_download")
        actionDownloadElt.classList.add("mx-1");
            var downloadImg = document.createElement("img");
            downloadImg.setAttribute("src", "../static/images/download.svg");
            downloadImg.setAttribute("alt", "download");
            downloadImg.setAttribute("title", "Download");
            downloadImg.setAttribute("width", "25");
            downloadImg.setAttribute("height", "25");
        actionDownloadElt.appendChild(downloadImg);

        var actionEditElt = document.createElement("a");
        actionEditElt.href = "#";
        actionEditElt.setAttribute("title", "edit");
        actionEditElt.setAttribute("id", "log_edit")
        actionEditElt.classList.add("mx-1");
            var editImg = document.createElement("img");
            editImg.setAttribute("src", "../static/images/pencil.svg");
            editImg.setAttribute("alt", "edit");
            editImg.setAttribute("title", "Convert to Rinex");
            editImg.setAttribute("width", "25");
            editImg.setAttribute("height", "25");
        actionEditElt.appendChild(editImg);

        var actionDeleteElt = document.createElement("a");
        actionDeleteElt.href = "#";
        actionDeleteElt.setAttribute("title", "delete");
        actionDeleteElt.setAttribute("id", "log_delete");
        actionDeleteElt.setAttribute("data-toggle", "modal")
        actionDeleteElt.classList.add("mx-1");
            var deleteImg = document.createElement("img");
            deleteImg.setAttribute("src", "../static/images/trash.svg");
            deleteImg.setAttribute("alt", "delete");
            deleteImg.setAttribute("title", "Delete");
            deleteImg.setAttribute("width", "25");
            deleteImg.setAttribute("height", "25");
        actionDeleteElt.appendChild(deleteImg);

        // Adding icons for file's actions
        for (log of msg) {
            actionDownloadElt.href = "/logs/download/" + log.name
            //some download examples : https://pythonise.com/series/learning-flask/sending-files-with-flask
            log['actions'] = actionDownloadElt.outerHTML + actionEditElt.outerHTML + actionDeleteElt.outerHTML;
        }

        // Updating the table content
        $('#logtable').bootstrapTable('removeAll');
        
        $('#logtable').bootstrapTable('load', msg);
        //var zz = $('#logtable').bootstrapTable('getData');
        //console.log(" table data : ");
        //console.log(zz);
        })

       // ################" SOCKETS ##########################"
   
       function downloadURI(uri, name) {
            var link = document.createElement("a");
            // If you don't know the name or want to use
            // the webserver default set name = ''
            link.setAttribute('download', name);
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            link.remove();
            };

        // server return the raw to rinex result
        socket.on('rinex ready', function(msg){
        response = JSON.parse(msg);
        console.log(response);
        if (response.result == "success") {           
            $('#create-rinex-button').html('Create Rinex file');
            //location.href = "/logs/download/" + response.file;
            const SuccessTitleElt = document.createElement("h5");
            SuccessTitleElt.classList.add("text-success");
            SuccessTitleElt.textContent = "Success!";
            SuccessTitleElt.id = "success_title";
            $('#rinex-conversion-msg').append(SuccessTitleElt);

            const SuccessElt = document.createElement("p");
            SuccessElt.classList.add("text-left");
            SuccessElt.appendChild(document.createTextNode("Your Rinex file is ready "));
            var rinexDownBtnElt = document.createElement("a");
            rinexDownBtnElt.text = "Download it!";
            //rinexDownBtnElt.href = "/logs/download/" + response.file;
            //rinexDownBtnElt.target = "_blank";
            rinexDownBtnElt.setAttribute("title", "download rinex file");
            rinexDownBtnElt.classList.add("btn", "btn-primary");
            rinexDownBtnElt.id="download-rinex-btn";
            SuccessElt.appendChild(rinexDownBtnElt);
            SuccessElt.id = "success_msg";
            $('#rinex-conversion-msg').append(SuccessElt);
            rinexDownBtnElt.onclick = function (){
                //Using this js function to download, because a <a href=.. disconnect socketio
                var link = document.createElement("a");
                link.setAttribute('download', '');
                link.href = "/logs/download/" + response.file;
                document.body.appendChild(link);
                link.click();
                link.remove();
            }       
        }
        else if (response.result == "failed") {
            $('#create-rinex-button').html('Create Rinex file');
            const failedTitleElt = document.createElement("h5");
            failedTitleElt.classList.add("text-danger");
            failedTitleElt.textContent = "Failed!";
            failedTitleElt.id = "failed_title";
            $('#rinex-conversion-msg').append(failedTitleElt);

            const failedElt = document.createElement("p");
            failedElt.classList.add("text-left");
            if (response.msg.includes("more than 1 file")) {
                failedElt.appendChild(document.createTextNode("There is more than 1 file in the archive you want to convert. The reason could be a power outage or a main service stop/start. Please try with an archive containing only one file"));
                failedElt.id = "failed_msg";
            };
            $('#rinex-conversion-msg').append(failedElt);
        };
    });

})