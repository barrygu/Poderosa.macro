import Poderosa;
import Poderosa.ConnectionParam;
import Poderosa.Terminal;
import Poderosa.Macro;
import Poderosa.View;
import System;
import System.IO;
import System.Text;
import System.Threading;
//import System.Net;
import System.Net.Sockets;
//import System.Diagnostics;
//import System.Diagnostics.ProcessStartInfo;

// local  MAC: "54:EE:75:1C:D0:0E"
//var defaultTarget = "00-0e-9f-fa-c0-ac";
var gTargetInfo = {};

var env = new Environment();

var conn;

/**
 * Arguments are Passed by Value
 *  The parameters, in a function call, are the function's arguments.
 *  JavaScript arguments are passed by value: The function only gets to know the values, not the argument's locations.
 *  If a function changes an argument's value, it does not change the parameter's original value.
 *  Changes to arguments are not visible (reflected) outside the function.
 * 
 * Objects are Passed by Reference
 *  In JavaScript, object references are values.
 *  Because of this, it looks like objects are passed by reference:
 *  If a function changes an object property, it changes the original value.
 *  Changes to object properties are visible (reflected) outside the function.
 **/

var local_host = {};//{MacAddress:null,DNSHostName:null,IPAddress:null};
var target_host = {};//{NetAddress:null,MacAddress:null,IPAddress:null};
var reIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

//System.Environment.Exit(100) // will exit the poderosa

/**/ // main procedure
//env.Debug.ShowTraceWindow();
//gTargetInfo = SelectTarget();
gTargetInfo.MacAddress = "00-0e-9f-fa-c0-ac";
if (gTargetInfo != null && (gTargetInfo.MacAddress || gTargetInfo.IPAddress))
  main();
//env.Debug.Trace("done.");
//env.Debug.HideTraceWindow();
/**/

/** /
function waitUntilAvailable(ie) 
{
const READYSTATE_UNINITIALIZED  = 0;
const READYSTATE_LOADING        = 1;
const READYSTATE_LOADED         = 2;
const READYSTATE_INTERACTIVE    = 3;
const READYSTATE_COMPLETE       = 4;

    var maxWaitTime   = 5000; // ¥ß¥êÃë
    var retryInterval = 100;
    var maxCount      = maxWaitTime / retryInterval;

    var count = 0;
    
    while (ie.Busy || ie.ReadyState != READYSTATE_COMPLETE) {
        Thread.Sleep(retryInterval);
        if (count++ > maxCount) {
            return false;
        }
    }
    return true;
}

function SelectTarget()
{
	var TargetInfo = {};
	var objIE = new ActiveXObject("InternetExplorer.Application");
	var objShell = new ActiveXObject("WScript.Shell");

	objIE.Navigate("about:blank");
	objIE.Document.title = 'Select a target for Poderosa';
	objIE.ToolBar        = false;
	objIE.Resizable      = false;
	objIE.StatusBar      = false;
	objIE.Width          = 320;
	objIE.Height         = 200;

	objIE.Left = 100;
	objIE.Top  = 100;

    if (!waitUntilAvailable(objIE))
      return TargetInfo;

	objIE.Document.body.innerHTML = '<div align="center">\n' +
		'<p><input type="hidden" id="fOK" value="0"></p>\n' +
		'<p><select name="macSelector">\n' +
		'<option value="00-0e-9f-fa-c0-ac">My OMAP</option>\n' +
		'<option value="00-0e-9f-fa-c1-be">Xingui\'s OMAP</option>\n' +
		'<option value="00-0e-9f-fa-c1-d1">Qiaohui\'s OMAP</option>\n' +
		'<option value="00-80-c8-3b-26-f4">Qiaohui\'s Jacinto</option>\n' +
		'<option value="">N/A</option>\n' +
		'</select></p>\n' +
		'<p><select name="ipSelector">\n' +
		'<option value="">N/A</option>\n' +
		'<option value="192.168.199.119">192.168.199.119</option>\n' +
		'</select></p>\n' +
		'<p><input type="submit" value="OK" onClick="VBScript:fOK.value=1"></p>'
	objIE.Document.body.style.overflow = "auto";
	objIE.Visible = true;
    objShell.AppActivate(objIE.Document.title);
    
	try {
		while (objIE.Document.all.fOK.value == 0) {
			Thread.Sleep(10);
		}

		TargetInfo.MacAddress = objIE.Document.all.macSelector.value;
		TargetInfo.IPAddress = objIE.Document.all.ipSelector.value;
		env.Debug.Trace(String.Format("target info MAC:{0}, IP:{1}", TargetInfo.MacAddress, TargetInfo.IPAddress));
		objIE.Quit();
	} catch (e) {
		env.Debug.Trace(String.Format("{0}", e));
	}

	objIE = null;
	//Thread.Sleep(10000);

	return TargetInfo;
}
/**/

function main()
{
	local_host.MacAddress = "54:EE:75:1C:D0:0E";
	
	getLocalIP(local_host);
	if (!local_host.IPAddress /*|| !local_host.IPAddress.match(reIP)*/)
	{
		env.Util.MessageBox("Can't find IP Address for my local host, do nothing");
		return;
	}
	env.Debug.Trace(String.Format("local host IP: {0}", local_host.IPAddress));

	if (gTargetInfo.MacAddress) {
		target_host.MacAddress = gTargetInfo.MacAddress;
	} /*else {
		target_host.MacAddress = defaultTarget;
	}*/
	target_host.NetAddress = local_host.IPAddress.match(/\d+\.\d+\.\d+/).ToString();
	env.Debug.Trace(String.Format("target host net: {0}", target_host.NetAddress));
	if (gTargetInfo.IPAddress)
		target_host.IPAddress = gTargetInfo.IPAddress;
	else
		get_target_ip(target_host);

	if (!target_host.IPAddress /*|| !target_host.IPAddress.match(reIP)*/)
	{
		env.Util.MessageBox("Can't find IP Address for target host, do nothing");
		return;
	}
	env.Debug.Trace(String.Format("target IP: {0}", target_host.IPAddress));

	telnet_omap(local_host, target_host);
}

//function get_target_ip(local_host, target_host)
function get_target_ip(target_host)
{
	var ip_remote;

	for (var step = 0; step < 2; step++) {
		ip_remote = find_ip_in_arptable(target_host.MacAddress);
		if (ip_remote != null) {
			target_host.IPAddress = ip_remote;
			return true
		}

		if (!step) {
			arp_update_udp(target_host.NetAddress);
		}
	}

	return false
}

function getLocalIP(local_host)
{
    var objIP;
    var WMI = GetObject("winmgmts:{impersonationlevel=impersonate}!" + "root/cimv2");
    var sql = "select * from Win32_NetworkAdapterConfiguration where IPEnabled=true";
    var enmPing = new Enumerator(WMI.ExecQuery(sql));
    while(!enmPing.atEnd())
    {
        objIP = enmPing.item();
        if (objIP.MACAddress == local_host.MacAddress)
        {
            local_host.DNSHostName = objIP.DNSHostName
            local_host.IPAddress = objIP.IPAddress(0)
            return true
        }
        enmPing.moveNext();
    }
    return false
}

// use WSH.Shell.Run with pipe because of popup console
/**/
function find_ip_in_arptable(mac)
{
    var fnTable = Path.GetTempFileName();
	env.Debug.Trace('Checking arp table');
	var oShell = new ActiveXObject("WScript.Shell");
    oShell.Run("%comspec% /c arp -a > " + fnTable, 0, true);
    oShell = null;
    if (!File.Exists(fnTable)) {
        env.Debug.Trace('arp table in ' + fnTable + ' not found');
        return null
    }

	env.Debug.Trace('arp table in ' + fnTable + ' found');
    var output:StreamReader = File.OpenText(fnTable)
	var ipaddr = find_ip(output, mac);
    output.Close()
    File.Delete(fnTable)
    return ipaddr;
}

function find_ip(stmReader, mac)
{
	var line;
	env.Debug.Trace("enter function find_ip")
	while(!stmReader.EndOfStream) {
		line = stmReader.ReadLine()
		//env.Debug.Trace(line)
		if (!line) continue;
		if (line.Contains(mac)) {
			env.Debug.Trace('found mac')
			return line.match(reIP);
		}
	}
	env.Debug.Trace('mac not found')
	return null;
}
/** /
function find_ip_in_arptable(mac)
{
	var oShell = new ActiveXObject("WScript.Shell");
	var oExec = oShell.Exec("%comspec% /c arp.exe -a");
	var arpOut = oExec.StdOut;
	var Retry = 10;

	while (oExec.Status == 0 && Retry-- > 0) System.Threading.Thread.Sleep(100);

	//var ipaddr = find_ip_from_text(oExec.StdOut.ReadAll(), mac);
	var ipaddr = find_ip(arpOut, mac);

	return ipaddr;
}

function find_ip(stdOut, mac)
{
	var line;
	while(!stdOut.AtEndOfStream) {
		line = stdOut.ReadLine()
		if (!line) continue;
		if (line.Contains(mac)) {
			return line.match(reIP);
		}
	}
	return null;
}
/**/
/**/
function arp_update_udp(svrAddrs)
{
	var UDP_DISCARD_PORT = 9;
	var echoBytes = System.Text.Encoding.ASCII.GetBytes("echo string...");
	var udpc = new System.Net.Sockets.UdpClient(System.Net.Sockets.AddressFamily.InterNetwork);

	for (var i = 1; i < 255; i++)
	{
		var newAddr = svrAddrs + '.' + i;
		udpc.Send(echoBytes, echoBytes.Length, newAddr, UDP_DISCARD_PORT);
	}
	return;
}
/** /
function arp_update_udp(svrAddrs)
{
	var oShell = new ActiveXObject("WScript.Shell");
	env.Debug.Trace('update arp table');
	oShell.Run("wakearp.exe " + svrAddrs, 0, true);
	oShell = null;
}
/**/
// This function checks incoming data until a command line prompt has been displayed.
// If no data were received for 5 seconds, this function returns false.
function waitForPrompt(prompt) {
	var line = '';
	while(!line.match(prompt)) {
		var data = conn.ReceiveData(60000); // wait new data for 1 minutes
		if (data == null) {
		  env.Debug.Trace('Timeout');
		  return false; // timout
		}
		line += data;
	}
	return true; // command-line prompt detected
}

function waitForPromptXY(prompt, end, timeout) {
	var line = '';
	while(true) {
		if (line.EndsWith(prompt))
			return 'X';
		if (line.EndsWith(end))
			return 'Y';
		var data = conn.ReceiveData(1); // wait new data for 1 minutes
		if (data == null && --timeout == 0) {
		  env.Debug.Trace('Timeout');
		  break;
		}
		line += data;
	}
	return null;
}

function telnet_omap(local_host, target_host) {
	/*
	//if you want to connect using SSH, create SSHTerminalParam instead of TelnetTerminalParam
	var param = new SSHTerminalParam(ConnectionMethod.SSH2, host, account, password);
	*/

    var account = "root";
	var tDir = "Target"
	var adUser = "JGu"
    var password = "bag!2345";
	var tPath;

    var cmd_prompt = "hu-omap:/dev/shmem> ";
	var param = new TelnetTerminalParam(target_host.IPAddress);

	//Telnet negotiation
	conn = env.Connections.Open(param);
	if (conn == null) {
		return -1;
	}
	param = null;
    if (!waitForPrompt("login:"))
        return -1;
    conn.TransmitLn(account);
    
    if (!waitForPrompt(cmd_prompt))
        return -1;

    conn.TransmitLn("cat `find /opt/sys/etc -regex '(dis2|w230)_version.txt'`; echo");
    /*System.Threading.*/Thread.Sleep(1);
	tPath = String.Format("/{0}/scripts/dump_sh:/{0}/dis2:/{0}/cmds:/{0}/scripts:/opt/mm/bin:$PATH", tDir)
    conn.TransmitLn("export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/mm/lib;export PATH=" + tPath);
    /*System.Threading.*/Thread.Sleep(1);
    //conn.TransmitLn("mount -uw /fs/sda0");
    //System.Threading.Thread.Sleep(100);

	conn.ReceiveData();

    var mount;
    mount = String.Format("fs-cifs -vvv -d ADHARMAN -abL //{0}:{1}:/{2} /{2} {3}", local_host.DNSHostName, local_host.IPAddress, tDir, adUser)
	mount = String.Format("[[ -d /{0} ]] || {1}", tDir, mount)
    conn.TransmitLn(mount);

	if (waitForPromptXY("Password:", cmd_prompt, 10000) == 'X')
    {
        conn.TransmitLn(password);
    }
}
