import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
const dir='docs/qa/facility-app/phase2'
const actual=PNG.sync.read(fs.readFileSync(`${dir}/canonical-dpr1.png`))
const results=[]
for (const [label,file] of [['pre-phase2','pre-phase2-default.png'],['phase1','../source/phase1-baseline.png'],['figma','figma-reference.png']]) {
 const ref=PNG.sync.read(fs.readFileSync(`${dir}/${file}`))
 if(actual.width!==1440||actual.height!==734||ref.width!==1440||ref.height!==734)throw Error('Wrong viewport')
 const diff=new PNG({width:1440,height:734}), overlay=new PNG({width:1440,height:734}), side=new PNG({width:2880,height:734})
 const pixels=pixelmatch(ref.data,actual.data,diff.data,1440,734,{threshold:.1,includeAA:false})
 let exact=0,sum=0
 for(let y=0;y<734;y++)for(let x=0;x<1440;x++) {
  const i=(y*1440+x)*4;let changed=false
  for(let c=0;c<4;c++){overlay.data[i+c]=Math.round((actual.data[i+c]+ref.data[i+c])/2);side.data[(y*2880+x)*4+c]=ref.data[i+c];side.data[(y*2880+x+1440)*4+c]=actual.data[i+c];if(c<3){sum+=Math.abs(actual.data[i+c]-ref.data[i+c]);changed ||= actual.data[i+c]!==ref.data[i+c]}}
  if(changed)exact++
 }
 for(const [suffix,img]of [['diff',diff],['overlay',overlay],['side-by-side',side]])fs.writeFileSync(`${dir}/${label}-${suffix}.png`,PNG.sync.write(img))
 results.push({reference:label,differentPixels:pixels,exactDifferentPixels:exact,fraction:pixels/(1440*734),meanAbsoluteChannelDifference:sum/(1440*734*3)})
}
fs.writeFileSync(`${dir}/visual-comparison.json`,JSON.stringify({viewport:[1440,734],dpr:1,zoom:1,results},null,2));console.log(JSON.stringify(results,null,2))
if(results[0].exactDifferentPixels!==0) throw Error('Phase 2 default differs from the preserved pre-change capture; inspect the unmasked difference.')
