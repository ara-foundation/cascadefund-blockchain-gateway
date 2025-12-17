# Crypto sockets
A package that connects to the blockchain and interacts with the 
smartcontracts. It's build on the [Zeromq](https://zeromq.org/) network library
and provides two sockets to interact with.

First is the request/reply socket to interact with the smartcontracts.
The second socket is the subscriber to listen incoming events.

## 
Crypto sockets has two options. Server side which also comes as the docker image.
The other socket is client side. Available from `@ara-web/crypto-sockets` package.

> Requires `.env` based on the `.env.example`.

## Todo
Add compilation to the javascript in the dockerfile, instead serving demo dev.