import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runJob} from '../skills/cloudbrowser/scripts/run_bounded_job.mjs';

for(const failure of [null,'navigate_to_url','open_browser','close_browser']) {
 test('bounded job lifecycle with '+(failure??'successful result'),async t=>{
  const out=await mkdtemp(join(tmpdir(),'cloudbrowser-job-test-'));t.after(()=>rm(out,{recursive:true,force:true}));
  const calls=[];const address='wss://browser.cloudbrowser.ai/fixture';
  const client={async connect(){},async request(){return {tools:['open_browser','connect_to_browser','navigate_to_url','get_page_content','take_screenshot','close_browser','get_browsers'].map(name=>({name}))};},async call(name,args){calls.push([name,args]);if(name===failure)throw new Error('Fixture failure');if(name==='open_browser')return{address};if(name==='get_page_content')return{pageData:{title:'CloudBrowser',bodyText:'CloudBrowser fixture',url:'https://cloudbrowser.ai/mcp',headings:[]}};if(name==='take_screenshot')return{screenshot:'data:image/jpeg;base64,/9j/2Q=='};if(name==='get_browsers')return{browsers:[{address:'pre-existing-customer-browser'}]};return{success:true};}};
  if(failure)await assert.rejects(runJob({client,out}));else await runJob({client,out});
  assert.equal(calls.filter(([n])=>n==='open_browser').length,1);
  assert.equal(calls.filter(([n])=>n==='close_browser').length,failure==='open_browser'?0:1);
  for(const [name,args] of calls)if(name==='close_browser')assert.equal(args.address,address);
  const report=JSON.parse(await readFile(join(out,'result.json'),'utf8'));
  assert.equal(report.browserClosed,!['open_browser','close_browser'].includes(failure));
  assert.ok(!JSON.stringify(report).includes(address));
 });
}
