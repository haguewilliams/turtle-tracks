"""Remove MobileNet's unused 1,001-class head; preserve its image embeddings."""
import json,math,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
source=ROOT/'.model-cache/backbone';dest=ROOT/'.model-cache/pruned-backbone';dest.mkdir(exist_ok=True)
model=json.loads((source/'model.json').read_text());nodes={n['name']:n for n in model['modelTopology']['node']}
keep=set()
def visit(name):
    name=name.removeprefix('^').split(':')[0]
    if name in keep:return
    keep.add(name)
    for parent in nodes[name].get('input',[]):visit(parent)
visit('module_apply_default/MobilenetV2/Logits/AvgPool')
specs=[];chunks=[]
for group in model['weightsManifest']:
    data=b''.join((source/p).read_bytes() for p in group['paths']);offset=0
    for w in group['weights']:
        dtype=w.get('quantization',{}).get('dtype',w['dtype'])
        size=math.prod(w['shape'])*{'float32':4,'int32':4,'bool':1,'uint8':1,'uint16':2}[dtype]
        if w['name'] in keep:specs.append(w);chunks.append(data[offset:offset+size])
        offset+=size
    if offset!=len(data):raise ValueError('Model byte length does not match its manifest')
data=b''.join(chunks);paths=[]
for offset in range(0,len(data),1024*1024):
    name=f'weights-{len(paths)+1}.bin';paths.append(name);(dest/name).write_bytes(data[offset:offset+1024*1024])
model['modelTopology']['node']=[n for n in model['modelTopology']['node'] if n['name'] in keep]
model['weightsManifest']=[{'paths':paths,'weights':specs}]
(dest/'model.json').write_text(json.dumps(model,separators=(',',':')))
print('Pruned backbone bytes:',len(data),'nodes:',len(keep))
