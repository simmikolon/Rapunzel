//
//  RPGravityPhysicsComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPGravityPhysicsComponent: GKComponent {

    var physicsBody: SKPhysicsBody
    
    init(physicsBody: SKPhysicsBody, colliderType: RPColliderType) {
        
        self.physicsBody = physicsBody
        self.physicsBody.affectedByGravity = true
        self.physicsBody.dynamic = true
        self.physicsBody.usesPreciseCollisionDetection = true
        self.physicsBody.allowsRotation = false
        self.physicsBody.categoryBitMask = colliderType.categoryMask
        self.physicsBody.collisionBitMask = colliderType.collisionMask
        self.physicsBody.contactTestBitMask = colliderType.contactMask
    }
}
