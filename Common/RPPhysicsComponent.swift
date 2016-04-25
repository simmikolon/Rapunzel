//
//  RPPhysicsComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPhysicsComponent: GKComponent {

    var physicsBody: SKPhysicsBody
    
    init(physicsBody: SKPhysicsBody, colliderType: RPColliderType) {
        
        self.physicsBody = physicsBody
        self.physicsBody.affectedByGravity = false
        self.physicsBody.dynamic = false
        self.physicsBody.allowsRotation = false
        self.physicsBody.categoryBitMask = colliderType.categoryMask
        self.physicsBody.collisionBitMask = colliderType.collisionMask
        self.physicsBody.contactTestBitMask = colliderType.contactMask
        self.physicsBody.usesPreciseCollisionDetection = true
    }
}
