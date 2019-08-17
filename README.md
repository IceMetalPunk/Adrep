# Adrep
## Asynchronous Dictionary REPL

Adrep allows you to create a "mini-REPL" in your application, which will run custom commands that you specify. It's based on, and dependent upon, [Inquirer](https://www.npmjs.com/package/inquirer).

### Installation
`npm install adrep`

### Usage
Require Adrep in your application normally, then create an instance of it:
```javascript
const Adrep = require('adrep');
const repl = new Adrep();
```

You can create new commands simply by using the `setCommand` method. All commands should return promises; they should resolve on success and reject on failure:
```javascript
repl.setCommand('greet', (name, greeting) => {
    if (name === 'Roger') {
        return Promise.reject('Go home, Roger!');
    }

    console.log(`Well, ${greeting}, ${name}!`);
    
    return Promise.resolve(`Greeted ${name}`);
});

repl.setCommand('increment', n => Promise.resolve(n + 1));
```

[!] Note: every Adrep REPL has a built-in `exit` command that cannot be overwritten. This is to prevent infinite loops. It will call the REPL's `exit` method, but you can call that method as well at any time to stop the loop yourself.

When you're done adding all your commands, you can start your Adrep REPL by calling its `run` method. This method takes three optional parameters: the string to use when prompting the user for a command, a callback to run on every successful command, and a callback to run on every failed command.
```javascript
repl.run('What would you like me to do? ', results => {
    console.log('Success! ', results);
}, error => {
    console.error('Error! ', error);
});
```

Successful results will be an array, where the first entry is the value the command's promise resolved with, the second is the command itself, and the rest are any arguments passed to the command. For instance:
```javascript
What would you like me to do? greet Bob howdy
Well, howdy, Bob!
// Success callback gets ['Greeted Bob', 'greet', 'Bob', 'howdy']
```

A user may include spaces in a single argument by "wrapping it in quotes"; likewise, they may use literal quotes by \\"escaping them\\" wherever needed.

Errors passed to the error callback will be an object with three properties: `type`, `value`, and `toString`.

* The `toString` method simply exists to get a string representation of the cause of the error; it can be useful in console logs, and is automatically called during template literal interpolation.
* The `type` property can be one of three values:
  * `Adrep.ERROR_CODES.ERR_NO_COMMAND`: No command was entered at all.
  * `Adrep.ERROR_CODES.ERR_UNKNOWN_COMMAND`: A command was entered, but it is unknown. 
  * `Adrep.ERROR_CODES.ERR_COMMAND_FAILED`: A known command was entered, but it returned a rejected promise.
* The `value` property is the same as the result of `toString` for all types except `ERR_COMMAND_FAILED`; in that case, the value will be an array, where the first entry is the value the command's promise rejected with, the second is the command, and the rest are any arguments supplied to the command.

For instance:
```javascript
What would you like me to do?
/* Error object is:
{
    type: Adrep.ERROR_CODES.ERR_NO_COMMAND,
    toString: () => ...,
    value: (Same as result of toString())
}
*/
What would you like me to do? nothing at all
/* Error object is:
{
    type: Adrep.ERROR_CODES.ERR_UNKNOWN_COMMAND,
    toString: () => ...,
    value: (Same as result of toString())
}
*/
What would you like me to do? greet Roger "hi, neighbors!"
/* Error object is:
{
    type: Adrep.ERROR_CODES.ERR_COMMAND_FAILED,
    toString: () => ...,
    value: ['Go home, Roger!', 'greet', 'Roger', 'hi, neighbors!']
}
*/
```

Final note: if you supply a success handler, it will be called for every successful command, even `exit`; you'll probably want to check the results array to make sure you don't try to handle commands that you don't want to.