// capacitor-ios-bypass.js

if (ObjC.available) {
    console.log("[*] Starting Capacitor iOS SSL Pinning & Jailbreak Bypass...");

    // -------------------------------------------------------------
    // 1. Bypass Capacitor SSL Pinning Plugin
    // -------------------------------------------------------------
    try {

        var SSLPlugin = ObjC.classes.SSLCertificateCheckerPlugin;

        if (SSLPlugin) {

            var checkCertMethod = SSLPlugin["- checkCertificate:"];

            if (checkCertMethod) {

                checkCertMethod.implementation = ObjC.implement(
                    checkCertMethod,
                    function (handle, selector, pluginCall) {

                        console.log("[+] Intercepted -[SSLCertificateCheckerPlugin checkCertificate:]");

                        var call = new ObjC.Object(pluginCall);

                        var NSDictionary = ObjC.classes.NSDictionary;
                        var NSNumber = ObjC.classes.NSNumber;

                        // Return `{ fingerprintMatched: true }`
                        var resultDict =
                            NSDictionary.dictionaryWithObject_forKey_(
                                NSNumber.numberWithBool_(1),
                                "fingerprintMatched"
                            );

                        call.resolve_(resultDict);
                    }
                );

                console.log("[+] SSL Pinning plugin bypass installed");
            }
        }

    } catch (err) {
        console.log("[-] SSL plugin hook error: " + err.message);
    }

    // -------------------------------------------------------------
    // 2. Bypass Generic Capacitor Jailbreak Detection Plugins
    // -------------------------------------------------------------
    try {

        for (var className in ObjC.classes) {

            if (className.toLowerCase().includes("security") ||
                className.toLowerCase().includes("jail") ||
                className.toLowerCase().includes("root")) {

                var JBClass = ObjC.classes[className];

                if (JBClass["- isJailBreakOrRooted:"]) {

                    var jbMethod = JBClass["- isJailBreakOrRooted:"];

                    jbMethod.implementation = ObjC.implement(
                        jbMethod,
                        function (handle, selector, pluginCall) {

                            console.log("[+] Jailbreak detection bypassed");

                            var call = new ObjC.Object(pluginCall);

                            var NSDictionary = ObjC.classes.NSDictionary;
                            var NSNumber = ObjC.classes.NSNumber;

                            var resultDict =
                                NSDictionary.dictionaryWithObject_forKey_(
                                    NSNumber.numberWithBool_(0),
                                    "isJailBreak"
                                );

                            call.resolve_(resultDict);
                        }
                    );
                }
            }
        }

    } catch (err) {
        console.log("[-] Jailbreak hook error: " + err.message);
    }
}


// -------------------------------------------------------------
// 3. Bypass Native iOS TLS Trust Validation
// -------------------------------------------------------------

var errSecSuccess = 0;
var kSecTrustResultProceed = 1;

try {

    var secTrustEvaluateWithError =
        Module.findExportByName("Security", "SecTrustEvaluateWithError");

    if (secTrustEvaluateWithError) {

        Interceptor.attach(secTrustEvaluateWithError, {

            onLeave: function (retval) {

                console.log("[+] Bypassed SecTrustEvaluateWithError");

                retval.replace(1);

            }
        });
    }


    var secTrustEvaluate =
        Module.findExportByName("Security", "SecTrustEvaluate");

    if (secTrustEvaluate) {

        Interceptor.attach(secTrustEvaluate, {

            onEnter: function (args) {

                this.resultPtr = args[1];

            },

            onLeave: function (retval) {

                console.log("[+] Bypassed SecTrustEvaluate");

                if (!this.resultPtr.isNull()) {

                    Memory.writeU32(this.resultPtr, kSecTrustResultProceed);

                }

                retval.replace(errSecSuccess);

            }

        });
    }

} catch (err) {

    console.log("[-] Error hooking Security framework: " + err.message);

}
