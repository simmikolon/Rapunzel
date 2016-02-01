//
//  RPDebugPlatformLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit
import SpriteKit

class RPPlatformLayerEntity: RPLayerEntity {
    
    var entities: [GKEntity]
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraNode: SKCameraNode) {
        entities = []
        super.init(withParallaxFactor: factor, cameraNode: cameraNode)
        addPlatforms()
    }
    
    func addPlatforms() {
        
        let platformEntity = RPPlatformEntity()
        entities.append(platformEntity)
        renderComponent.addChild(platformEntity.renderComponent.node)
        platformEntity.renderComponent.node.position = CGPoint(x: 0, y: 0)
        
        var index = CGFloat(1.0)
        var multi = CGFloat(150.0)
        
        func addPlatform() {
            
            let position: CGPoint
            
            let index_ = Int(index)
            
            if index_ % 2 == 0 {
                
                position = CGPointMake(120.0, index * multi)
                
            } else {
                
                position = CGPointMake(-120.0, index * multi)
            }
            
            let platformEntity = RPPlatformEntity()
            entities.append(platformEntity)
            renderComponent.addChild(platformEntity.renderComponent.node)
            platformEntity.renderComponent.node.position = position
            
            index += 1.0
        }
        
        for var index = 0; index < 50; ++index {
            
            addPlatform()
        }
    }
}
