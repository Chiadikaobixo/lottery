const assert = require('assert')
const ganache = require("ganache");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { abi, evm } = require('../compile')


beforeEach(async () => {
    // Get a list of all account
    fetchedAccounts = await web3.eth.getAccounts()

    // use one of those account to deploy the contract
    lottery = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ from: fetchedAccounts[0], gas: '1000000' })
    
})

describe('lottery contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    })

    it('allow one account to enter', async () => {
        await lottery.methods.addPlayer().send({
            from: fetchedAccounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: fetchedAccounts[0]
        })

        assert.equal(fetchedAccounts[0], players[0])
        assert.equal(1, players.length)
    })

    it('allow multiple account to enter', async () => {
        await lottery.methods.addPlayer().send({
            from: fetchedAccounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })

        await lottery.methods.addPlayer().send({
            from: fetchedAccounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        })

        await lottery.methods.addPlayer().send({
            from: fetchedAccounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: fetchedAccounts[0]
        })

        assert.equal(fetchedAccounts[0], players[0])
        assert.equal(fetchedAccounts[1], players[1])
        assert.equal(fetchedAccounts[2], players[2])
        assert.equal(3, players.length)
    })

    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.addPlayer().send({
                from: fetchedAccounts[0],
                value: 0
            })
            assert(false);
        } catch (error) {
            assert(error);
        }
    })

    it('only manager can call pickWinner', async() => {
        try {
            await lottery.methods.pickWinner().send({
                from: fetchedAccounts[1]
            })
            assert(false);
        } catch (error) {
            assert(error);
        }
    })

    it('enters player, sends money to the  winner and reset the players array', async() => {
        await lottery.methods.addPlayer().send({
            from: fetchedAccounts[0],
            value: web3.utils.toWei('2', 'ether')
        })

        const initialBalance = await web3.eth.getBalance(fetchedAccounts[0]);

        await lottery.methods.pickWinner().send({
            from: fetchedAccounts[0]
        });

        const finalBalance = await web3.eth.getBalance(fetchedAccounts[0]);
        const difference = finalBalance - initialBalance
        assert(difference > web3.utils.toWei('1.8', 'ether'));

        const playersArray = await lottery.methods.getPlayers().call()
        assert.deepEqual([], playersArray)
    })
})