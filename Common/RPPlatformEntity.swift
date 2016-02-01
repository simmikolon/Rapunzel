//
//  RPPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit
import SpriteKit

class RPPlatformEntity: RPEntity {

    let renderComponent: RPRenderComponent
    var physicsComponent: RPPhysicsComponent!
    var debugSpriteComponent: RPDebugSpriteComponent!
    
    override init() {
        
        renderComponent = RPRenderComponent()
        
        super.init()

        physicsComponent = RPPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 100, height: 32)), colliderType: .Obstacle)
        debugSpriteComponent = RPDebugSpriteComponent(withNode: renderComponent.node, length: 100)
        
        renderComponent.node.entity = self;
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        addComponent(renderComponent)
        addComponent(physicsComponent)
        addComponent(debugSpriteComponent)
    }
}
