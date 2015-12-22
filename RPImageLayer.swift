//
//  RPImageLayer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 17.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

class RPImageLayer: RPLayer {
    
    var imageName = "RPBackgroundLayerTest1"
    var imageNameForRepeationImage = "RPBackgroundLayerTest1"
    
    override func setup() {
        
        setupBackground()
    }
    
    private func setupBackground() {
        
        let backgroundSprite = SKSpriteNode(imageNamed: imageName)
        
        backgroundSprite.texture?.filteringMode = SKTextureFilteringMode.Nearest
        backgroundSprite.anchorPoint = CGPointMake(0.5, 0.0)
        backgroundSprite.setScale(2)
        backgroundSprite.position = CGPoint(x: 0.0, y: 0.0)
        addChild(backgroundSprite)
        
        let offset = backgroundSprite.frame.height
        
        for var index: CGFloat = 0; index < 50; ++index {
            
            let repetitionSprite = SKSpriteNode(imageNamed: imageNameForRepeationImage)
            
            repetitionSprite.texture?.filteringMode = SKTextureFilteringMode.Nearest
            repetitionSprite.anchorPoint = CGPointMake(0.5, 0.0)
            repetitionSprite.setScale(2)
            
            let yOffset = offset + (repetitionSprite.frame.height * index)
            repetitionSprite.position = CGPoint(x: 0.0, y: yOffset)
            addChild(repetitionSprite)
        }
    }
    
    override func update(currentTime: NSTimeInterval) {
        
    }
    
    override func didFinishUpdate() {
        /*
        for node: SKNode in children {
            
            /* Wenn Node sich aus dem Bildschirm bewegt, dann entfernen */
            
            let absolutePosition = scene?.convertPoint(node.position, fromNode: node.parent!)
            let borderPosition = 0 - (scene!.size.height / 2) - (node.frame.size.height / 2)
            
            if absolutePosition!.y < borderPosition {
                
                //node.removeFromParent()
            }
        }*/
    }
}
