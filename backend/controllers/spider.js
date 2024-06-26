const {JSDOM}=require('jsdom')

async function crawlPage(baseURL,currentURL,pages){
 

  const baseURLObj=new URL(baseURL)
  const currentURLObj=new URL(currentURL)
  if(baseURLObj.hostname!==currentURLObj.hostname){
    return pages
  }
  const normalizedCurrentURL=normalizeURL(currentURL)
  if(pages[normalizedCurrentURL]>0){
    pages[normalizedCurrentURL]++;
    return pages;
  }
  pages[normalizedCurrentURL]=1;
  console.log(`actively crawling: ${currentURL}`)
   // Stop crawling if the number of pages exceeds 100
   if (Object.keys(pages).length > 100) {
    console.log('Reached page limit of 100, stopping crawl.');
    return pages;
  }
  try{
    const resp=await fetch(currentURL)
    if(resp.status>399){
        console.log(`error in fetch with status code: ${resp.status} on page: ${currentURL}`)
        return pages;
    }
    const contentType=resp.headers.get("content-type")
    if(!contentType.includes("text/html")){
        console.log(`non-html response,content type: ${contentType}, on page: ${currentURL}`)
        return pages
    }
  const htmlBody=await resp.text();
  const nextURLs=getURLsFromHTML(htmlBody,baseURL)
   for(const nextURL of nextURLs){
    if (Object.keys(pages).length > 100) {
      console.log('Reached page limit of 100, stopping further crawling.');
      break;
    }
    pages=await crawlPage(baseURL,nextURL,pages)
   }
}catch(err){
   console.log(`error in fetch: ${err.message},on page:${currentURL}`)
  }
  return  pages; 
}

function getURLsFromHTML(htmlBody,baseURL){
    const urls=[]
    const dom=new JSDOM(htmlBody)
    const linkElements=dom.window.document.querySelectorAll('a')
    for(const linkElement of linkElements){
        if(linkElement.href.slice(0,1)==='/'){
            //relative
            try{
            const urlObj=new URL(`${baseURL}${linkElement.href}`)
            urls.push(urlObj.href)}
            catch(err){
                console.log(`error with relative url: ${err.message}`)
            }
        }
        else{
            //absolute
            try{
                const urlObj=new URL(linkElement.href)
                urls.push(urlObj.href)}
                catch(err){
                    console.log(`error with absolute url: ${err.message}`)
                }
        }
        
    }
    return urls
}

function normalizeURL(urlString){
    const urlObj=new URL(urlString)

    const hostPath= `${urlObj.hostname}${urlObj.pathname}`
    if(hostPath.length>0 && hostPath.slice(-1)==='/'){
        return hostPath.slice(0,-1);
    }
    return hostPath;
}

function printReport(pages) {
  console.log('==========');
  console.log('REPORT');
  console.log('==========');
  const sortedPages = sortPages(pages);
  for (const sortedPage of sortedPages) {
    const url = sortedPage[0];
    const hits = sortedPage[1];
    console.log(`Found ${hits} links to page: ${url}`);
  }
}

function sortPages(pages) {
  const pagesArr = Object.entries(pages);
  pagesArr.sort((a, b) => b[1] - a[1]);
  return pagesArr;
}

module.exports = {
  normalizeURL,
  getURLsFromHTML,
  crawlPage,
  sortPages,
  printReport,
};