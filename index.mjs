import fs from "fs"
import { join, resolve, dirname, basename } from "path"
import { lookup } from "mime-types"

let root = dirname(resolve(process.argv[2]))

let f = fs.createReadStream(process.argv[2])

let out = fs.createWriteStream(join("out", basename(process.argv[2])))

const searchTypes = {
    73: (f) => fs.readFileSync(join(root, f)),
    69: (f) => `data:${lookup(f) || "application/octet-stream"};base64,${fs.readFileSync(join(root, f)).toString("base64")}`,
    66: (f) => `URL.createObjectURL(new Blob([atob("${fs.readFileSync(join(root, f)).toString("base64")}")], {type: "${lookup(f) || "application/octet-stream"}"}))`
}

function flushBuffer(ignoreLast) {
    out.write(ignoreLast ? buf.slice(0, -1) : buf)
    buf = ""
}

let searching = false, searchStage = 0, searchType = "", searchFile = ""
let buf = ""
f.on("data", (chunk) => {
    for(let c of chunk) {
        buf += String.fromCharCode(c)
        if(searching) {
            switch(searchStage) {
                case 0:
                    searchType = c
                    if(!searchTypes[c]) {
                        searching = false
                        flushBuffer()
                        break
                    }
                    searchStage++
                    break
                case 1:
                case 2:
                    if(c === 123/* { */) searchStage++
                    else {
                        searching = false
                        flushBuffer()
                    }
                    break
                
                case 3:
                    if(c === 125/* } */) {
                        searchStage++
                    }
                    else searchFile += String.fromCharCode(c)
                    break
                case 4:
                    if(c === 125/* } */) buf = searchTypes[searchType](searchFile)
                    flushBuffer()
                    searching = false
            }
        }
        else if(c === 36/* $ */) {
            flushBuffer(true)
            buf = "$"
            searching = true
            searchStage = 0, searchFile = ""
        }
    }
})
f.on("end", () => {
    flushBuffer()
    //out.close()
})