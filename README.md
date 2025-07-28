# Cascadefund Blockchain Gateway
A package that connects to the blockchain and interacts with the 
smartcontracts. It's build on the [Zeromq](https://zeromq.org/) network library
and provides two sockets to interact with.

First is the request/reply socket to interact with the smartcontracts.
The second socket is the subscriber to listen incoming events.

## Cascade Withdrawer