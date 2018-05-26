var http = require('http');
var ws = require('ws');
var https=require('https');
var fs=require('fs');
var keypath=process.cwd()+'/ssl/2_chat.yuyisoft.net.key';
var certpath=process.cwd()+'/ssl/1_chat.yuyisoft.net_bundle.crt';
var redis = require("redis"), client = redis.createClient();

var options = {
 key: fs.readFileSync(keypath),
 cert: fs.readFileSync(certpath),
};

//var ids = new Array(); //所有用户对应的id
//var cons = new Array(); //所有连接,ws客户端
var cons = new Map(); //所有连接,ws客户端
var waittochoose = new Array(); //等待配对的用户
var i;
var timer = setInterval(CreateRoom,500);


function CreateRoom() {
    if(waittochoose.length>=2){
        console.log("匹配成功");
        var n0 = waittochoose[0];
        var n1 = waittochoose[1];
        write_redis(n0,n1);
        write_redis(n1,n0);
        waittochoose.splice(0,2);
    }
}

function write_redis(key,value) {
    //写入JavaScript(JSON)对象
    client.set(key,value,function(err,response){
        //console.log(response);
    });
}

var server=https.createServer(options, function (req, res) {  //要是单纯的https连接的话就会返回这个东西
 res.writeHead(403);//403即可
 res.end("This is a WebSockets server!\n");
}).listen(13386);

process.on('SIGINT', function() {
    console.log('Got SIGINT.Closing program.');
    client.quit();
    process.exit();
});

var wss = new ws.Server( { server: server } );
wss.on( 'connection', function ( wsConnect , req) {
  	//var ip = req.connection.remoteAddress;
    //ip = ip.substring(7,ip.length);
  	var id = Date.now()+randomString(6);
  	// ids.push(id);
    // cons.push(wsConnect);
    cons.set(id,wsConnect);
    waittochoose.push(id);
  	console.log("New connection from id:"+id);
    wsConnect.on( 'message', function ( message ) {
        var msgObj = JSON.parse(message);
        var action = msgObj.action;
        console.log(message);
        switch (action){
            case "get_new_id":    //当命令为请求新对象id时
                client.get(id,function(err,response){
                    if(response != "" && response != null && response != undefined){
                        var text = '{"action":"new_id","value":"'+ response +'"}';  //返回新id
                        console.log(text);
                        wsConnect.send(text);
                    }
                });
                break;
            case "send_message":
                if (msgObj.to_id != ""){
                    var to_id = msgObj.to_id;
                    if(cons.has(to_id)){
                        cons.get(to_id).send('{"action":"new_message","value":"'+ msgObj.value +'"}');
                        console.log('{"action":"new_message","value":"'+ msgObj.value +'"}');
                    }
                }
                break;
        }
        // for (i=0; i<cons.length;i++) {
        //     // if (ids[i] == msgObj.toUserId) {
        //     //     cons[i].send(message);
        //     //     break;
        //     // }
        // }
    });
  	wsConnect.on('close', function(){
  		console.log('id:'+id+" disconnected");
  		for(i=0;i<waittochoose.length;i++){
  		    if(waittochoose[i] == id){
  		        waittochoose.splice(i,1);
  		        break;
            }
        }
        cons.delete(id);
    });
});

function randomString(len) {
    var $chars = 'ABCDEFGHIJKMNPQRSTWXYZabcdefhijklmnopqrstwxyz1234567890';
    var maxPos = $chars.length;
    var pwd = '';
    for (var i1 = 0; i1 < len; i1++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}