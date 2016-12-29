//
//  GravityPhysicsComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class GravityPhysicsComponent: PhysicsComponent {

    // var physicsBody: SKPhysicsBody
    
    override init(physicsBody: SKPhysicsBody, colliderType: ColliderType) {
        
        super.init(physicsBody: physicsBody, colliderType: colliderType)
        
        self.physicsBody = physicsBody
        self.physicsBody.affectedByGravity = true
        self.physicsBody.isDynamic = true
        self.physicsBody.usesPreciseCollisionDetection = true
        self.physicsBody.allowsRotation = false
        self.physicsBody.categoryBitMask = colliderType.categoryMask
        self.physicsBody.collisionBitMask = colliderType.collisionMask
        self.physicsBody.contactTestBitMask = colliderType.contactMask
        self.physicsBody.usesPreciseCollisionDetection = true
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
