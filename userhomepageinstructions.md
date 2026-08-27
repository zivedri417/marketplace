Messaging Interface: Do you want the messaging UI to be a list of active conversations that open into a chat window directly on the profile page, or should it just be a list of links that redirect to a dedicated /messages/[id] page? 

* the  messaging UI should be a list of active conversations that open into a chat window directly on the profile page

Buying Items: To support reviews, the system must know who bought an item. We currently don't have a "Buy Now" or "Accept Offer" button. I will add a buyer_id column to the products table, but we will need to build the actual "Purchase / Accept Offer" flow later to populate this data. 

* acceptable.
