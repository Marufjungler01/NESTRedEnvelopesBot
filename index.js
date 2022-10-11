const {Telegraf, Markup, session} = require('telegraf')
const {PutCommand, DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand} = require('@aws-sdk/lib-dynamodb');
const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const {isAddress} = require("ethers/lib/utils");
const axios = require('axios')
const {RateLimiter} = require("limiter");

// Command
// start - submit or update wallet address
// admin - admin portal to send prize

//
//    #####
//   #     #  ####  #    # ###### #  ####
//   #       #    # ##   # #      # #    #
//   #       #    # # #  # #####  # #
//   #       #    # #  # # #      # #  ###
//   #     # #    # #   ## #      # #    #
//    #####   ####  #    # #      #  ####
//

const lmt = new RateLimiter({
  tokensPerInterval: 30,
  interval: 'second',
})

const WHITELIST = [2130493951, 5035670602, 552791389, 1859030053]

const ddbClient = new DynamoDBClient({
  region: 'ap-northeast-1',
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
bot.use(session())

//
//    #####
//   #     # #####   ##   #####  #####
//   #         #    #  #  #    #   #
//    #####    #   #    # #    #   #
//         #   #   ###### #####    #
//   #     #   #   #    # #   #    #
//    #####    #   #    # #    #   #
//
bot.start(async (ctx) => {
  const chatId = ctx.update.message.chat.id
  if (chatId < 0) {
    return
  }
  await lmt.removeTokens(1)
  ctx.reply(`NEST TOKEN + Binance BAB TOKEN Giveaway

Join the giveaway group and get daily NEST token  Timely giveaways.

Conditions are.
Wallet address has >400 NEST tokens and has Binance BAB tokens.

Reward.

1.Everyone gets at least 10 NEST per day.
2.Invite 1 person to participate, 10 NEST.
*FCFS 1000 people

How do I join?
1. Buy 400 NEST and own 1 BAB token
2. Join：https://t.me/NEST_BABGiveaway
3. Join: https://t.me/NESTRedEnvelopesBot
Add your wallet address in the bot.
4. Click: on the giveaway link at the pin of the group.
5. Click: snatch

How to invite?
1.Join: @NESTRedEnvelopesBot
2.Click: My ref info
* Invite others to our BAB giveaway via your invite link!

Invitation rewards, issued every Monday.Your NEST must be obtained on NEST SWAP or pancakes.

NEST TOKEN BUY
https://finance.nestprotocol.org/#/swap
https://pancakeswap.finance/

BAB TOKEN GET
https://www.binance.com/en/support/faq/bacaf9595b52440ea2b023195ba4a09c`)
  if (ctx.startPayload && Number(ctx.startPayload) !== ctx.update.message.from.id) {
    // Update new username and new invite code, not myself
    await ddbDocClient.send(new UpdateCommand({
      TableName: 'nest-prize-users',
      Key: {
        user_id: ctx.update.message.from.id,
      },
      UpdateExpression: 'set invite_code = :invite_code, username = :username',
      ExpressionAttributeValues: {
        ':invite_code': Number(ctx.startPayload),
        ':username': ctx.update.message.from.username || '',
      }
    }))
  } else {
    // update new username, if not exist, create new one
    await ddbDocClient.send(new UpdateCommand({
      TableName: 'nest-prize-users',
      Key: {
        user_id: ctx.update.message.from.id,
      },
      UpdateExpression: 'set username = :username',
      ExpressionAttributeValues: {
        ':username': ctx.update.message.from.username || '',
      }
    }))
  }
  ctx.session = {}
  // query user in db
  try {
    const queryUserRes = await ddbDocClient.send(new GetCommand({
      TableName: 'nest-prize-users',
      Key: {
        user_id: ctx.update.message.from.id,
      },
    }))
    await lmt.removeTokens(1)
    ctx.reply(`Welcome to NEST Prize!

You wallet: ${queryUserRes?.Item?.wallet || 'Not set yet'}
You twitter: ${queryUserRes?.Item?.twitter || 'Not set yet'}

Your ref link: https://t.me/NESTRedEnvelopesBot?start=${ctx.update.message.from.id}

Welcome to click the 🤩 button below to join our developer community!`, Markup.inlineKeyboard([
      [Markup.button.callback('Update Wallet', 'setUserWallet'), Markup.button.callback('Update Twitter', 'setUserTwitter')],
      [Markup.button.callback('My Referrals', 'getUserReferrals'), Markup.button.callback('🤩 For Developer', 'forDeveloper')],
    ]))
  } catch (e) {
    ctx.reply("Some error occurred, please try /start again later.")
  }
})

bot.action('menu', async (ctx) => {
  await lmt.removeTokens(1)
  try {
    const queryUserRes = await ddbDocClient.send(new GetCommand({
      TableName: 'nest-prize-users',
      Key: {
        user_id: ctx.update.callback_query.from.id,
      },
    }))
    await lmt.removeTokens(1)
    ctx.editMessageText(`Welcome to NEST Prize!

You wallet: ${queryUserRes?.Item?.wallet || 'Not set yet'}
You twitter: ${queryUserRes?.Item?.twitter || 'Not set yet'}

Your ref link: https://t.me/NESTRedEnvelopesBot?start=${ctx.update.callback_query.from.id}

Welcome to click the 🤩 button below to join our developer community!`, Markup.inlineKeyboard([
      [Markup.button.callback('Update Wallet', 'setUserWallet'), Markup.button.callback('Update Twitter', 'setUserTwitter')],
      [Markup.button.callback('My Referrals', 'getUserReferrals'), Markup.button.callback('🤩 For Developer', 'forDeveloper')],
    ]))
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Some error occurred, please try again later.")
  }
})

bot.action('forDeveloper', async (ctx) => {
  await lmt.removeTokens(1)
  ctx.editMessageText(`*Another Revolution in Blockchain*

NEST ecosystem is a paradigm revolution to the traditional
market mechanism, providing the blockchain world with a
whole new range of development tools and creative new assets.

*NEST PVM*
NEST Probability Virtual Machine (PVM) is a virtual machine-like structure based on the basic function library. Developers can develop various exciting applications based on the function library, similar to Ethereum virtual machine (EVM) programming.
Github repository: [NEST-PVM-V1.0](https://github.com/NEST-Protocol/NEST-PVM-V1.0). More [PVM Mechanism](https://nestprotocol.org/docs/Concept/PVM/)

*NEST Oracle*
NEST oracle is the only truly decentralized oracle on the market today.
Github repository: [NEST-Oracle-V4.0](https://github.com/NEST-Protocol/NEST-Oracle-V4.0). [How to Mining](https://nestprotocol.org/docs/Technical-Reference-NEST-Oracle/#how-to-mining/), [How to Call Price](https://nestprotocol.org/docs/Technical-Reference-NEST-Oracle/#how-to-call-price)

More [Developer Doc](https://nestprotocol.org/docs/PVM-Technical-Reference/)
Welcome follow our [Github](https://github.com/NEST-Protocol). We will also develop some targeted airdrop tools, like [this bot](https://github.com/NEST-Protocol/NESTRedEnvelopesBot).
`, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...Markup.inlineKeyboard([
      [Markup.button.url('Follow Github', 'https://github.com/NEST-Protocol'), Markup.button.url('Developer Doc', 'https://nestprotocol.org/docs/PVM-Technical-Reference/')],
      [Markup.button.url('New Issues', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues/new'), Markup.button.callback('« Back', 'menu')],
    ])
  })
})

bot.action('getUserReferrals', async (ctx) => {
  try {
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: 'nest-prize-users',
      IndexName: 'invite-code-index',
      KeyConditionExpression: 'invite_code = :invite_code',
      ExpressionAttributeValues: {
        ':invite_code': ctx.update.callback_query.from.id,
      }
    }))
    if (result.Count === 0) {
      await ctx.answerCbQuery("You have no referrals yet.")
      return
    }
    await lmt.removeTokens(1)
    ctx.editMessageText(`My Referrals:

${result.Items.map((item) => {
      if (item?.username) {
        return `@${item.username}`
      } else {
        return item.user_id
      }
    }).join(',')
    }`, Markup.inlineKeyboard([
      [Markup.button.callback('« Back', 'menu')],
    ]))
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Some error occurred, please try again later.")
  }
})

bot.command('admin', async (ctx) => {
  const chat_id = ctx.chat.id;
  if (chat_id < 0) {
    return
  }
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  await replyL1MenuContent(ctx)
})

bot.action('setUserWallet', async (ctx) => {
  ctx.session = {intent: 'setUserWallet'}
  await lmt.removeTokens(1)
  await ctx.editMessageText('Please send your wallet address:')
})

bot.action('setUserTwitter', async (ctx) => {
  ctx.session = {intent: 'setUserTwitter'}
  await lmt.removeTokens(1)
  await ctx.editMessageText('Please send your twitter username with @:')
})

//
//   #         #      #     #
//   #        ##      ##   ## ###### #    # #    #
//   #       # #      # # # # #      ##   # #    #
//   #         #      #  #  # #####  # #  # #    #
//   #         #      #     # #      #  # # #    #
//   #         #      #     # #      #   ## #    #
//   ####### #####    #     # ###### #    #  ####
//
const replyL1MenuContent = async (ctx) => {
  await lmt.removeTokens(1)
  ctx.reply(`NEST Prize Admin Portal`, Markup.inlineKeyboard([
    [Markup.button.callback('Send', 'setConfig')],
    [Markup.button.callback('Liquidate', 'liquidate-info')],
  ]))
}

const editReplyL1MenuContent = async (ctx) => {
  const chat_id = ctx.update.callback_query.from.id
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  await lmt.removeTokens(1)
  await ctx.editMessageText('NEST Prize Admin Portal', Markup.inlineKeyboard([
    [Markup.button.callback('Send', 'setConfig')],
    [Markup.button.callback('Liquidate', 'liquidate-info')],
  ]))
}

bot.action('backToL1MenuContent', editReplyL1MenuContent)

//
//    #        #####     #                                                       ###
//    #       #     #    #       #  ####  #    # # #####    ##   ##### ######     #  #    # ######  ####
//    #             #    #       # #    # #    # # #    #  #  #    #   #          #  ##   # #      #    #
//    #        #####     #       # #    # #    # # #    # #    #   #   #####      #  # #  # #####  #    #
//    #       #          #       # #  # # #    # # #    # ######   #   #          #  #  # # #      #    #
//    #       #          #       # #   #  #    # # #    # #    #   #   #          #  #   ## #      #    #
//    ####### #######    ####### #  ### #  ####  # #####  #    #   #   ######    ### #    # #       ####
//
const editReplyL2LiquidateInfoContent = async (ctx) => {
  // query number of NEST Prize status is pending
  const chat_id = ctx.update.callback_query.from.id
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  try {
    const [openResult, pendingResult] = await Promise.all([
      ddbDocClient.send(new QueryCommand({
        TableName: 'nest-prize',
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'open',
        },
      })),
      ddbDocClient.send(new QueryCommand({
        TableName: 'nest-prize',
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'pending',
        },
      })),
    ])
    let pendingList = []
    for (const item of pendingResult.Items) {
      let walletMap = {}
      let amount = 0
      for (const user of item.record.slice(0, item.config.quantity)) {
        if (walletMap[user.wallet.toLowerCase()]) {
          continue
        }
        walletMap[user.wallet.toLowerCase()] = true
        const index = pendingList.findIndex((i) => i.wallet.toLowerCase() === user.wallet.toLowerCase())
        if (index === -1) {
          if (user.amount > 0 && (amount + user.amount) <= item.config.amount) {
            amount += user.amount
            pendingList.push(user)
          }
        } else {
          if (user.amount > 0 && (amount + user.amount) <= item.config.amount) {
            amount += user.amount
            pendingList[index].amount += user.amount
          }
        }
      }
    }
    const openAmount = openResult.Items.reduce((acc, cur) => acc + cur.config.amount - cur.balance, 0)
    const pendingAmount = pendingResult.Items.reduce((acc, cur) => acc + cur.config.amount - cur.balance, 0)
    await lmt.removeTokens(1)
    await ctx.editMessageText(`*NEST Prize Liquidate*

Number of open NEST Prize: ${openResult.Count}, had snatched: ${openAmount} NEST.

Number of pending NEST Prize: ${pendingResult.Count}, had snatched: ${pendingAmount} NEST, different users: ${pendingList.length}.`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Stop All Snatching Prize', 'pending', openResult.Count === 0)],
        [Markup.button.callback('Liquidate All Snatched Prize', 'liquidate', pendingResult.Count === 0)],
        [Markup.button.callback('« Back', 'backToL1MenuContent')],
      ])
    })
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Some error occurred, please try again later.")
  }
}

bot.action('backToL2LiquidateInfoContent', editReplyL2LiquidateInfoContent)

bot.action('liquidate-info', editReplyL2LiquidateInfoContent)

//
//    #        #####     #
//    #       #     #    #       #  ####  #    # # #####    ##   ##### ######
//    #             #    #       # #    # #    # # #    #  #  #    #   #
//    #        #####     #       # #    # #    # # #    # #    #   #   #####
//    #             #    #       # #  # # #    # # #    # ######   #   #
//    #       #     #    #       # #   #  #    # # #    # #    #   #   #
//    #######  #####     ####### #  ### #  ####  # #####  #    #   #   ######
//
const editReplyL2DoLiquidateContent = async (ctx) => {
  const chat_id = ctx.update.callback_query.from.id
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  try {
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: 'nest-prize',
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'pending',
      },
    }))
    
    let pendingList = []
    for (const item of result.Items) {
      let walletMap = {}
      let amount = 0
      for (const user of item.record.slice(0, item.config.quantity)) {
        if (walletMap[user.wallet.toLowerCase()]) {
          continue
        }
        walletMap[user.wallet.toLowerCase()] = true
        const index = pendingList.findIndex((i) => i.wallet.toLowerCase() === user.wallet.toLowerCase())
        if (index === -1) {
          if (user.amount > 0 && (amount + user.amount) <= item.config.amount) {
            amount += user.amount
            pendingList.push(user)
          }
        } else {
          if (user.amount > 0 && (amount + user.amount) <= item.config.amount) {
            amount += user.amount
            pendingList[index].amount += user.amount
          }
        }
      }
    }
    
    if (pendingList.length === 0) {
      await ctx.answerCbQuery("No pending NEST Prize found to send.")
      await lmt.removeTokens(1)
      await ctx.editMessageText("No pending NEST Prize found to send.", Markup.inlineKeyboard([
        [Markup.button.callback('« Back', 'backToL2LiquidateInfoContent')],
      ]))
      return
    }
    
    for (const item of result.Items) {
      ddbDocClient.send(new UpdateCommand({
        TableName: 'nest-prize',
        Key: {
          chat_id: item.chat_id,
          message_id: item.message_id,
        },
        UpdateExpression: 'SET #s = :s, #t = :t',
        ConditionExpression: '#s = :ps',
        ExpressionAttributeNames: {
          '#s': 'status',
          '#t': 'ttl',
        },
        ExpressionAttributeValues: {
          ':s': 'processing',
          ':t': Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
          ':ps': 'pending',
        },
      })).catch((e) => {
        console.log(e)
        ctx.answerCbQuery('Update NEST Prize status failed.')
      })
    }
    
    try {
      let data = 'address,amount\n'
      for (const item of pendingList) {
        data += `${item.wallet},${item.amount}\n`
      }
      await lmt.removeTokens(1)
      await ctx.replyWithDocument({
        source: Buffer.from(data),
        filename: `pending.csv`,
      })
    } catch (e) {
      ctx.reply("Send csv file failed, please try again later.")
    }
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Fetch pending NEST Prize failed, please try again later.")
    await lmt.removeTokens(1)
    ctx.reply("Fetch pending NEST Prize failed, please try again later.")
  }
}

bot.action('liquidate', editReplyL2DoLiquidateContent)

// Pending
const editReplyL2PendingContent = async (ctx) => {
  const chat_id = ctx.update.callback_query.from.id
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  try {
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: 'nest-prize',
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'open',
      },
    }))
    for (const item of result.Items) {
      ddbDocClient.send(new UpdateCommand({
        TableName: 'nest-prize',
        Key: {
          chat_id: item.chat_id,
          message_id: item.message_id,
        },
        UpdateExpression: 'SET #s = :s',
        ConditionExpression: '#s = :os',
        ExpressionAttributeNames: {
          '#s': 'status',
        },
        ExpressionAttributeValues: {
          ':s': 'pending',
          ':os': 'open',
        },
      })).catch((e) => console.log(e))
    }
    await ctx.answerCbQuery('Stop All Snatching Prize Success!')
    await lmt.removeTokens(1)
    await ctx.editMessageText(`Stop All Snatching Prize Success!`, Markup.inlineKeyboard([
      [Markup.button.callback('Liquidate All Snatched Prize', 'liquidate')],
      [Markup.button.callback('« Back', 'backToL2LiquidateInfoContent')],
    ]))
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Some error occurred, please try again later.")
  }
}

bot.action('pending', editReplyL2PendingContent)

//
//    #        #####      #####                   #####
//    #       #     #    #     # ###### #####    #     #  ####  #    # ###### #  ####
//    #             #    #       #        #      #       #    # ##   # #      # #    #
//    #        #####      #####  #####    #      #       #    # # #  # #####  # #
//    #       #                # #        #      #       #    # #  # # #      # #  ###
//    #       #          #     # #        #      #     # #    # #   ## #      # #    #
//    ####### #######     #####  ######   #       #####   ####  #    # #      #  ####
//
bot.action('setConfig', async (ctx) => {
  ctx.session = {intent: 'setConfig'}
  await lmt.removeTokens(1)
  await ctx.editMessageText(`Enter NEST Prize config with json format.
  
*parameters:*
token: token symbol
quantity: number of NEST Prize
amount: amount of all NEST Prize
max: max amount of each NEST Prize
min: min amount of each NEST Prize
text: best wishes
chatId: target chatId
cover: cover uri
auth: auth uri

For example: { "token": "NEST", "quantity": 10, "amount": 20, "max": 10, "min": 1, "text": "This is a NEST Prize. @NESTRedEnvelopesBot", "chatId": "@nesttestredenvelopes", "cover": "", "auth": ""}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('« Back', 'backToL1MenuContent')],
    ])
  })
})

//
//   #        #####      #####
//   #       #     #    #     # ###### #    # #####
//   #             #    #       #      ##   # #    #
//   #        #####      #####  #####  # #  # #    #
//   #             #          # #      #  # # #    #
//   #       #     #    #     # #      #   ## #    #
//   #######  #####      #####  ###### #    # #####
//
bot.action('send', async (ctx) => {
  const chat_id = ctx.update.callback_query.from.id
  if (WHITELIST.findIndex((id) => id === chat_id) === -1) {
    await lmt.removeTokens(1)
    await ctx.reply(`Sorry, ${chat_id} are not allowed to use this command!`, Markup.inlineKeyboard([
      [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
    ]))
    return
  }
  const config = ctx.session?.config || undefined
  if (config) {
    try {
      // send message to chat_id, record chat_id and message_id to dynamodb
      let res
      if (config.cover !== '') {
        await lmt.removeTokens(1)
        res = await ctx.telegram.sendPhoto(config.chatId, config.cover, {
          caption: `${config.text}

Click snatch button!`,
          parse_mode: 'Markdown',
          protect_content: true,
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Snatch!', 'snatch')],
          ])
        })
      } else {
        await lmt.removeTokens(1)
        res = await ctx.telegram.sendMessage(config.chatId, `${config.text}

Click snatch button!`, {
          parse_mode: 'Markdown',
          protect_content: true,
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Snatch!', 'snatch')],
            [Markup.button.url('Newcomers', 'https://t.me/NESTRedEnvelopesBot'), Markup.button.url('🤩 Star Project', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot')]
          ])
        })
      }
      
      const message_id = res.message_id
      const chat_id = res.chat.id
      if (message_id && chat_id) {
        try {
          await ddbDocClient.send(new PutCommand({
            TableName: 'nest-prize',
            Item: {
              chat_id,
              message_id,
              config,
              balance: config.amount, // left balance of NEST Prize
              status: 'open', // open, pending, processing
              creator: ctx.from.id,
              record: [],
            },
          }))
          ctx.session = {}
          await ctx.answerCbQuery('NEST Prize Sent Success!')
          await editReplyL1MenuContent(ctx)
        } catch (e) {
          console.log(e)
          ctx.answerCbQuery("Some error occurred, please try again later.")
        }
      }
    } catch (e) {
      console.log(e)
      ctx.answerCbQuery('Sorry, I cannot send message to target chat.')
    }
  } else {
    ctx.answerCbQuery('Sorry, I cannot understand your config. Please try again.')
  }
})

//
//     #####
//   #     # #    #   ##   #####  ####  #    #
//   #       ##   #  #  #    #   #    # #    #
//    #####  # #  # #    #   #   #      ######
//         # #  # # ######   #   #      #    #
//   #     # #   ## #    #   #   #    # #    #
//    #####  #    # #    #   #    ####  #    #
//
bot.action('snatch', async (ctx) => {
  try {
    const queryUserRes = await ddbDocClient.send(new GetCommand({
      TableName: 'nest-prize-users',
      ConsistentRead: true,
      Key: {
        user_id: ctx.update.callback_query.from.id,
      },
    }))
    if (queryUserRes.Item === undefined || queryUserRes.Item?.wallet === undefined) {
      await ctx.answerCbQuery('Please Submit Wallet First!')
      return
    }
    const user = queryUserRes.Item
    try {
      const queryPrizeRes = await ddbDocClient.send(new GetCommand({
        TableName: 'nest-prize',
        ConsistentRead: true,
        Key: {
          chat_id: ctx.update.callback_query.message.chat.id,
          message_id: ctx.update.callback_query.message.message_id,
        }
      }))
      if (queryPrizeRes.Item === undefined) {
        ctx.answerCbQuery("The NEST Prize is not found.")
        return
      }
      const prize = queryPrizeRes.Item
      if (prize.record.some(record => record.user_id === ctx.update.callback_query.from.id)) {
        await ctx.answerCbQuery('You have already snatched this NEST Prize!')
        return
      }
      if (prize.record.some(record => record.wallet === user.wallet)) {
        await ctx.answerCbQuery('This wallet have already snatched this NEST Prize!')
        return
      }
      // check if NEST Prize is open
      if (prize.status !== 'open' || prize.balance <= 0) {
        await ctx.answerCbQuery(`Sorry, you are late. All NEST Prize have been given away.
Please pay attention to the group news. Good luck next time.`)
        if (prize.status === 'open') {
          ddbDocClient.send(new UpdateCommand({
            TableName: 'nest-prize',
            Key: {
              chat_id: ctx.update.callback_query.message.chat.id,
              message_id: ctx.update.callback_query.message.message_id,
            },
            UpdateExpression: 'set #status = :status',
            ExpressionAttributeNames: {'#status': 'status'},
            ExpressionAttributeValues: {
              ':status': 'pending',
            }
          })).catch(e => console.log(e))
        }
        return
      }
      // check auth api
      if (prize.config.auth) {
        // check user auth
        try {
          const res = await axios(prize.config.auth, {
            method: 'POST',
            data: JSON.stringify({
              "user_id": ctx.update.callback_query.from.id,
              "wallet": user?.wallet || null,
              "twitter": user?.twitter || null,
            }),
            headers: {
              'Content-Type': 'application/json',
            }
          })
          if (!res.data) {
            await ctx.answerCbQuery(`Sorry, you can't get this NEST Prize. Please read this rule carefully.`)
            return
          }
        } catch (e) {
          await ctx.answerCbQuery(`Sorry, some error occurred. Please try again later.`)
          return
        }
      }
      // can snatch
      let status = "open", amount
      // check if NEST Prize is need empty
      if (prize.record.length === prize.config.quantity - 1) {
        status = 'pending'
        amount = Math.floor(Math.random() * (prize.config.max - prize.config.min) + prize.config.min)
        if (prize.balance <= amount) {
          amount = prize.balance
        }
      } else {
        amount = Math.floor(Math.random() * (prize.config.max - prize.config.min) + prize.config.min)
        if (prize.balance <= amount) {
          status = 'pending'
          amount = prize.balance
        }
      }
      // update NEST Prize info in dynamodb
      try {
        await ddbDocClient.send(new UpdateCommand({
          TableName: 'nest-prize',
          Key: {
            chat_id: ctx.update.callback_query.message.chat.id,
            message_id: ctx.update.callback_query.message.message_id,
          },
          UpdateExpression: 'set balance = balance - :amount, #record = list_append(#record, :record), #status = :status',
          ConditionExpression: 'balance >= :amount',
          ExpressionAttributeNames: {'#record': 'record', '#status': 'status'},
          ExpressionAttributeValues: {
            ':amount': amount,
            ':record': [{
              user_id: ctx.update.callback_query.from.id,
              username: ctx.update.callback_query.from.username,
              amount,
              wallet: user.wallet,
            }],
            ':status': status,
          },
        }))
        await ctx.answerCbQuery(`Congratulations, you have got ${amount} NEST.`)
        await lmt.removeTokens(1)
        await ctx.reply(`🎉! ${ctx.update.callback_query.from?.username ? `@${ctx.update.callback_query.from.username}` : ctx.update.callback_query.from.id} have got ${amount} NEST.`)
      } catch (e) {
        console.log(e)
        ctx.answerCbQuery("Sorry, you didn't get it, try again!")
      }
    } catch (e) {
      console.log(e)
      ctx.answerCbQuery("Some error occurred, please try again later.")
    }
  } catch (e) {
    console.log(e)
    ctx.answerCbQuery("Some error occurred, please try again later.")
  }
})

//
//   #######           #     #
//   #     # #    #    ##   ## ######  ####   ####    ##    ####  ######
//   #     # ##   #    # # # # #      #      #       #  #  #    # #
//   #     # # #  #    #  #  # #####   ####   ####  #    # #      #####
//   #     # #  # #    #     # #           #      # ###### #  ### #
//   #     # #   ##    #     # #      #    # #    # #    # #    # #
//   ####### #    #    #     # ######  ####   ####  #    #  ####  ######
//
bot.on('message', async (ctx) => {
  const chat_id = ctx.message.chat.id
  const input = ctx.message.text
  // group message
  if (chat_id < 0) {
    // do nothing in group
  }
  // DM message
  else {
    const intent = ctx.session?.intent || undefined
    if (intent === undefined) {
      ctx.reply('Sorry, I forgot your intention. 10 seconds later, reply to me with the same content, thank you.')
    }
    else if (intent === 'setConfig') {
      try {
        const config = JSON.parse(ctx.message.text)
        if (config.token !== 'NEST') {
          await lmt.removeTokens(1)
          ctx.reply('Token must be NEST. Please try again later.')
          return
        }
        if (config.min > config.max) {
          await lmt.removeTokens(1)
          ctx.reply('Min amount must be less than max amount. Please try again later.')
          return
        }
        if (config.quantity < 1) {
          await lmt.removeTokens(1)
          ctx.reply('Quantity must be greater than 0. Please try again later.')
          return
        }
        await lmt.removeTokens(1)
        await ctx.reply(`Check it again:

token: ${config.token},
quantity: ${config.quantity},
amount: ${config.amount},
max: ${config.max},
min: ${config.min},
text: ${config.text},
chatId: ${config.chatId}
cover: ${config.cover}
auth: ${config.auth}
`, {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([
                [Markup.button.callback('Checked, Send Now!', 'send')],
                [Markup.button.callback('« Back', 'backToL1MenuContent')],
              ])
            }
        )
        ctx.session = {config: config}
      } catch (e) {
        console.log(e)
        await lmt.removeTokens(1)
        ctx.reply('Sorry, I cannot understand your config. Please try again.')
      }
    }
    else if (intent === 'setUserWallet') {
      if (isAddress(input)) {
        try {
          await ddbDocClient.send(new UpdateCommand({
            TableName: 'nest-prize-users',
            Key: {
              user_id: ctx.message.from.id,
            },
            UpdateExpression: 'SET wallet = :wallet',
            ExpressionAttributeValues: {
              ':wallet': input,
            }
          }))
          ctx.session = {}
          await lmt.removeTokens(1)
          ctx.reply(`Your wallet address has updated. ${input}`, Markup.inlineKeyboard([
            [Markup.button.callback('« Back', 'menu')],
            [Markup.button.callback('🤩 For Developer', 'forDeveloper')],
          ]))
        } catch (e) {
          await lmt.removeTokens(1)
          ctx.reply('Some error occurred, please try again later.', {
            reply_to_message_id: ctx.message.message_id,
            ...Markup.inlineKeyboard([
              [Markup.button.callback('« Back', 'menu')],
              [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
            ])
          })
        }
      } else {
        await lmt.removeTokens(1)
        ctx.reply('Please input a valid wallet address.', {
          reply_to_message_id: ctx.message.message_id,
        })
      }
    }
    else if (intent === 'setUserTwitter') {
      if (input.startsWith('@')) {
        try {
          await ddbDocClient.send(new UpdateCommand({
            TableName: 'nest-prize-users',
            Key: {
              user_id: ctx.message.from.id,
            },
            UpdateExpression: 'SET twitter = :twitter',
            ExpressionAttributeValues: {
              ':twitter': input.slice(1),
            }
          }))
          ctx.session = {}
          await lmt.removeTokens(1)
          ctx.reply(`Your twitter has updated. ${input.slice(1)}`, Markup.inlineKeyboard([
            [Markup.button.callback('« Back', 'menu')],
            [Markup.button.callback('🤩 For Developer', 'forDeveloper')],
          ]))
        } catch (e) {
          await lmt.removeTokens(1)
          ctx.reply('Some error occurred, please try again later.', {
            reply_to_message_id: ctx.message.message_id,
            ...Markup.inlineKeyboard([
              [Markup.button.callback('« Back', 'menu')],
              [Markup.button.url('New Issue', 'https://github.com/NEST-Protocol/NESTRedEnvelopesBot/issues')]
            ])
          })
        }
      } else {
        await lmt.removeTokens(1)
        ctx.reply('Please input a valid twitter account with @.', {
          reply_to_message_id: ctx.message.message_id,
        })
      }
    }
  }
})

//
//    #     #
//    #     #   ##   #    # #####  #      ###### #####
//    #     #  #  #  ##   # #    # #      #      #    #
//    ####### #    # # #  # #    # #      #####  #    #
//    #     # ###### #  # # #    # #      #      #####
//    #     # #    # #   ## #    # #      #      #   #
//    #     # #    # #    # #####  ###### ###### #    #
//
exports.handler = async (event, context, callback) => {
  const tmp = JSON.parse(event.body);
  await bot.handleUpdate(tmp);
  return callback(null, {
    statusCode: 200,
    body: '',
  });
};