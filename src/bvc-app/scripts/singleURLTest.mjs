// File: ./scripts/singleURLTest.mjs
// Description: Test ONLY the exact URL that works in your browser

import fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

// The EXACT URL that works in your browser
const TEST_URL = "https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io/-/media/BVC/BVC/Data/CMSData/CourseOutlines/ACCT1103Introduction%20to%20Financial%20AccountingFall%202020Winter%202021";

// Where to save the test file
const OUTPUT_FILE = "./test-download.pdf";

console.log("🧪 Testing EXACT URL that works in browser");
console.log(`🔗 URL: ${TEST_URL}`);
console.log(`💾 Output: ${OUTPUT_FILE}`);

async function testSingleURL() {
  try {
    console.log("\n📥 Making request...");
    
// The REAL cookies from your browser that actually work
const WORKING_COOKIES = `__cf_bmJ_208HzyhSZrk96HUJOZLrNGU_LFNRdwQ9UnV7KE3Wc=1751779764-1.0.1.1-zwepde2.8S7DvhV4SLeqy8xJnup82wzi9wrrMHWAAozAEqSQ9bJKUUbRXubhfL8E; __CSRFCOOKIE=a559ed93-5eed-4721-8cb4-41f4701b8bcc; .AspNet.Cookies=H8RTXxRGW3wsm1REwZBig_ua4S1qRHmtJmqTbP2i2Z59wyV8fzoPnBVwh2Ls14OW-mFbKz8sdc8R4XKPdRPp6-8Sy_TEZtNiC7vvlh1Y4_wqu-8XMJ-hYV-GmGURjoH886Ko9AgjOqqOxBiO2BHQC3wCnArNinNkcdmYbno1LC9CSD9P3ekWoU75m2wl0clHRGMrY1E3NM3ENgPJSx_1YfMaYWCaCuU4ljgNGh4wcRkbyDImbKNn0V_aqhRBvZ_vCzm_I-wkhIGBGEaWKVGgGp_f1ail0ouMDpXJdgUUs19jeGFT4YQmdqUl86i09nsyrtLqZjoDZ0UKsZouZNNetupqhZ1lYpd8Q7roaIetRSB-glvlkAaKoJb0EFi2mr4YrPcAt9Wl1P1FJXCdifzY3WCsLlB7yn4w4ipjlJCwWbWSF8JuB1f2pg8oF9LI7JutOei2W9oLgYJWihk7OY-wmnLwQ4min_swnSPHod1QQL38PtrvaYSnk-CDKRHzzCwVCi00U8D4eo0F1zwhPVJ5zv7s1v3NdX-jFyFwkWQs5uUd4ctCuvBekgroGe_101jtRCEqyh5Q1rx4NVkxy52CmbciWX8eJoU99PXWA9KKLqI7R6rh8EsNNePuoUnP0ka5QatNHMuFEfeX2nmwCASfEG6_zCXP_g6ViP1qiCAaN-GfkZyTq0t5TTL9Jt22bFt4kSn14zjJreKaFRv2xmOtn-7lfMYqlt9-pLISCx2xwZ3UtveBlIlSVPhxCUh2Eksy1pC7k-DzUR2QvSPBm7DNw1blQsz5DXTLp22AD3yov5hmT7vMUO10J5fs0Rjn4qWqJRgcdrvdLR7Dehwzeum9UpMN2IUdW4mY7ltgtwb31TvPP_LeW1teMO-i8f_Uvt_2pz1hJ-t4oaOnzOuPVpDbNk9XRWlbVLxIrNn1yOHMOOFSdD9roylnns85-RKvhXZ-jPKs3QdmuiDnAjlJOKu6b2_gTq_Dl0cTj5mUF1DNUFFerSFTGzoAAU4NOFBcupTbMVIzvVd8hr8IX4ptbovUExQay3DLYbslUFvYq3olfUQdIaQFAQ9rkF-vdVcYNE63yPSsQ5ywBGqiAZYhC2doJfxNk36_7qvvnFPfC9NQWyfK0I50pEbtNcaQzfryU3wI5UUriV0O9USV21QXkM3tkBc_O0nOOworpE4fm0AaaSVSw-jryUqGDd4wm3ofrWWg21uZpn7Cjbecw-hz91qJWT3_C66WtpVKQTYIl7iQWK85LaVUEDO-cOsPJMQqYUmaTrlIfMNeuLXbMQHCqkNM1dmV9XWDtOBF2rjSJ9_fzwLQiCQ6EwTsV4MzjgNaM6RJ-8vGLHiv2TXaww27GEJF6qsGc3-UW2BqG6uGGiTqGruf5EXixadDWTZU-4yd9cwsjXE4awjgZ_xu1TbiJWEkY6CKb-xQG1gRHwv7258PWkgFHK9O_FpteoziN_qM8U_WccF8edt0g-gSGif1foNoPxnfNucrOfgwBWqbZCfr_z83o9Uc66rgSFwPKlmMClPYdFZ7GCctOQ1OXHSy-PcZU8XOEBECi-sxfEE9Z3h5d4l-sCXO-z3zI-SwQju-EL0Yxmc; apt.sid=AP-BR1SACAOWQ2G-2-1751777780764-95129389; apt.uid=AP-BR1SACAOWQ2G-2-1751311608921-98172241.0.2.876053dc-5b56-4e03-9b7b-d6c94f9dcc4a; ASP.NET_SessionId=xbfy1o1lnplyd45gzs1bwp0x; bid_1cc5231e2655eea6c724058e362f8e2a=8c925461-4fd7-4d8a-9da1-45169e238b69; sc_fv=0.0.0; scContentEditorFoldersWidth=397; shell#lang=en; sitecore_userticket=470F487546F0438E82C8EB8518E89265E6B3641159D44AC589F1D86513E5667B`;

    const response = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cookie': WORKING_COOKIES,
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="137", "Google Chrome";v="137"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
    
    // Show all response headers
    console.log(`📑 All Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/pdf')) {
      console.log("✅ Got PDF! Downloading...");
      
      const fileStream = createWriteStream(OUTPUT_FILE);
      await pipeline(response.body, fileStream);
      
      const stats = await fs.stat(OUTPUT_FILE);
      console.log(`✅ SUCCESS! Downloaded ${stats.size} bytes to ${OUTPUT_FILE}`);
      
    } else {
      console.log("❌ Not a PDF response");
      const responseText = await response.text();
      console.log(`🔍 Response body (first 500 chars):`);
      console.log(responseText.substring(0, 500));
      
      // Save the HTML response for analysis
      await fs.writeFile("./test-response.html", responseText, 'utf-8');
      console.log("💾 Saved full response to ./test-response.html for analysis");
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testSingleURL();