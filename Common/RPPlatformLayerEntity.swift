//
//  RPDebugPlatformLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

class RPPlatformLayerEntity: RPLayerEntity, RPPlatformEntityDelegate {

    var entities: [GKEntity]
    var patternEntites: [RPPatternEntity]

    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0) {
        
        entities = []
        patternEntites = []
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        addPlatforms()
        addPattern()
    }
    
    func didRemovePlatform(platform: RPPlatformEntity) {
        
        guard let index = self.entities.indexOf(platform) else {
            fatalError("Entity not in Array!")
        }
        
        self.entities.removeAtIndex(index)
    }
    
    
    func addPattern() {
        
        let pattern = RPPatternEntity(layerEntity: self)
        self.entities.append(pattern)
    }
    
    
    func addPlatforms() {
        
        let platformEntity = RPDebugPlatformEntity(isBreakable: false, isBottomCollidable: false)
        
        entities.append(platformEntity)
        renderComponent.addChild(platformEntity.renderComponent.node)
        
        platformEntity.renderComponent.node.position = CGPoint(x: 0, y: 0)
        platformEntity.delegate = self
        platformEntity.renderComponent.node.zPosition = -5.0
        platformEntity.renderComponent.node.physicsBody = SKPhysicsBody(rectangleOfSize: CGSize(width: 1364, height: 16))
        platformEntity.renderComponent.node.physicsBody?.affectedByGravity = false
        platformEntity.renderComponent.node.physicsBody?.dynamic = false
        platformEntity.renderComponent.node.physicsBody?.categoryBitMask = RPColliderType.NormalPlatform.categoryMask
        platformEntity.renderComponent.node.physicsBody?.collisionBitMask = RPColliderType.NormalPlatform.collisionMask
        platformEntity.renderComponent.node.physicsBody?.contactTestBitMask = RPColliderType.NormalPlatform.contactMask
        
        /*
        var index = CGFloat(1.0)
        var multi = CGFloat(150.0)
        
        /**/
        
        func addPlatform() {
            
            let position: CGPoint
            
            let index_ = Int(index)
            
            if index_ % 2 == 0 {
                
                position = CGPointMake(120.0, index * multi)
                
            } else {
                
                position = CGPointMake(0, index * multi)
            }
            
            let platformEntity = RPDebugPlatformEntity(isBreakable: true, isBottomCollidable: false)
            entities.append(platformEntity)
            renderComponent.addChild(platformEntity.renderComponent.node)
            platformEntity.renderComponent.node.position = position
            platformEntity.delegate = self
            
            index += 1.0
        }
        
        /*
        for var index = 0; index < 40; ++index {
            
            addPlatform()
        }*/*/
    }
    
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        for entity: GKEntity in self.entities {
            
            if let platformEntity = entity as? RPPlatformEntity {
             
                platformEntity.updateWithDeltaTime(seconds)
                
            } else if let patternEntity = entity as? RPPatternEntity {
                
                patternEntity.updateWithDeltaTime(seconds)
            }
        }
    }
}
