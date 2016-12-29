//
//  PhysicsComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PhysicsComponent: GKComponent {

    var physicsBody: SKPhysicsBody
    
    init(physicsBody: SKPhysicsBody, colliderType: ColliderType) {
        
        self.physicsBody = physicsBody
        self.physicsBody.affectedByGravity = false
        self.physicsBody.isDynamic = false
        self.physicsBody.allowsRotation = false
        self.physicsBody.categoryBitMask = colliderType.categoryMask
        self.physicsBody.collisionBitMask = colliderType.collisionMask
        self.physicsBody.contactTestBitMask = colliderType.contactMask
        self.physicsBody.usesPreciseCollisionDetection = true
        
        super.init()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
