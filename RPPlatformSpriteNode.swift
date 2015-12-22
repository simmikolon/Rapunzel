//
//  RPPlatformSpriteNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

class RPPlatformSpriteNode: RPSpriteNode {
    
    override func setup() {
        
        let physicsBody = SKPhysicsBody(rectangleOfSize: size)
        
        physicsBody.affectedByGravity = true
        physicsBody.dynamic = false
        physicsBody.categoryBitMask = RPCollisionCategoryBitMask.Platform
        physicsBody.contactTestBitMask = RPCollisionCategoryBitMask.Player
        physicsBody.collisionBitMask = RPCollisionCategoryBitMask.Player
        physicsBody.usesPreciseCollisionDetection = true
        
        self.physicsBody = physicsBody
    }

    override func didBeginContact(withNode node: SKNode) {
        return
    }
}
