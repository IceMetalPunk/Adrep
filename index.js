const inquirer = require('inquirer');

function Adrep() {
    let exited = false;
    const commandMap = {
        exit: () => Promise.resolve(exited = true)
    };

    this.setCommand = function(name = '', f = function(){}) {
        if (!name) {
            throw new Error('No Adrep command name specified.');
        } else if (typeof name !== 'string') {
            throw new Error(`Adrep command name must be a string; ${typeof name} supplied instead.`);
        } else if (typeof f !== 'function') {
            throw new Error(`Adrep command callback must be a function; ${typeof f} supplied instead.`);
        } else {
            commandMap[name] = f;
        }
        return true;
    }

    const parseCommand = function(str = '') {
        const pieces = str.split(/ +/g);
        for (let i = 1; i < pieces.length; ++i) {
            if (pieces[i - 1].startsWith('"') && (!pieces[i - 1].endsWith('"') || pieces[i - 1].endsWith('\\"'))) {
                pieces[i - 1] += ' ' + pieces[i];
                const removeFrom = i;
                if (!pieces[i].endsWith('"') || pieces[i].endsWith('\\"')) {
                    --i;
                }
                else {
                    pieces[i - 1] = pieces[i - 1].replace(/(^|[^\\])"/g, '$1').replace(/\\"/g, '"');
                }
                pieces.splice(removeFrom, 1);
            }
        }

        if (pieces.length < 1 || pieces.every(val => typeof val !== 'string' || !val.trim())) {
            return Promise.reject({
                type: Adrep.ERROR_CODES.ERR_NO_COMMAND,
                value: Adrep.ERROR_CODES.ERR_NO_COMMAND(),
                toString: () => Adrep.ERROR_CODES.ERR_NO_COMMAND()
            });
        } else if (typeof commandMap[pieces[0]] !== 'function') {
            return Promise.reject({
                type: Adrep.ERROR_CODES.ERR_UNKNOWN_COMMAND,
                toString: () => Adrep.ERROR_CODES.ERR_UNKNOWN_COMMAND(pieces[0]),
                value: Adrep.ERROR_CODES.ERR_UNKNOWN_COMMAND(pieces[0])
            });
        }

        return commandMap[pieces[0]].apply(null, pieces.slice(1))
            .then(res => [res].concat(pieces))
            .catch(err => Promise.reject({
                type: Adrep.ERROR_CODES.ERR_COMMAND_FAILED,
                toString: () => Adrep.ERROR_CODES.ERR_COMMAND_FAILED(pieces[0], err),
                value: [err].concat(pieces)
            }));
    }

    this.run = function(prompt = 'Enter command: ', successHandler, errorHandler) {
        inquirer.prompt([
            {
                message: prompt,
                type: 'input',
                name: 'command'
            }
        ])
        .then(entered => {
            return parseCommand(entered.command);
        })
        .then(successHandler || (() => Promise.resolve()))
        .catch(errorHandler || (() => Promise.resolve()))
        .finally(() => {
            if (!exited) {
                this.run(prompt, successHandler, errorHandler);
            }
        })
    }
};
Object.defineProperty(Adrep, 'ERROR_CODES', {
    writable: false,
    configurable: false,
    enumerable: true,
    value: Object.freeze({
        ERR_NO_COMMAND: () => 'No command specified',
        ERR_UNKNOWN_COMMAND: c => `Unknown command ${c}`,
        ERR_COMMAND_FAILED: (c,r) => `Command ${c} failed with reason: ${r}`
    })
})

module.exports = Adrep;