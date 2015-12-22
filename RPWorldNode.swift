//
//  RPWorldNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

struct RPWorldNodeSettings {
    
    static let SmoothingFactor: CGFloat = 8.0
}

class RPWorldNode: RPNode, UpdateableNode, InputHandlingNode, RPCameraNodeDelegate, RPActionLayerDelegate {

    let actionLayer = RPActionLayer()
    
    private var layers: [RPLayer] = []
    
    override func setup() {
     
        func setupActionLayer() {
            
            actionLayer.parallaxFactor = 0.0
            
            actionLayer.delegate = self
            actionLayer.cameraNodeDelegate = self
            
            layers.append(actionLayer)
            
            addChild(actionLayer)
            
            actionLayer.setup()
        }
        
        func addLayers() {
            /*
            var layer = RPImageLayer()
            
            layer.imageName = "RPAlpha_BackgroundLayer"
            layer.imageNameForRepeationImage = "RPAlpha_BackgroundLayer_Top"
            layer.parallaxFactor = 6
            layer.zPosition = -1
            layer.setup()
            layer.position = CGPoint(x: 0, y: -300)
            addChild(layer)
            layers.append(layer)
            
            layer = RPImageLayer()
            layer.imageName = "RPAlpha_TowerLayer"
            layer.imageNameForRepeationImage = "RPAlpha_TowerLayer_Top"
            layer.parallaxFactor = 2
            layer.zPosition = 0
            layer.setup()
            layer.position = CGPoint(x: 0, y: -300)
            addChild(layer)
            layers.append(layer)
            
            layer = RPImageLayer()
            layer.imageName = "RPAlpha_MainTreeLayer"
            layer.imageNameForRepeationImage = "RPAlpha_MainTreeLayer_Top"
            layer.parallaxFactor = 1
            layer.zPosition = 1
            layer.setup()
            layer.position = CGPoint(x: 0, y: -300)
            addChild(layer)
            layers.append(layer)*/
            
            var layer = RPEmitterLayer()
            addChild(layer)
            layer.zPosition = 1
            layer.particleSize = 5.0
            layer.maxAlpha = 1.0
            layer.minAlpha = 0.5
            layer.parallaxFactor = 0
            layer.damping = 8.0
            layer.populate(numberOfColumns: 6, numberOfRows: 6)
            layer.setup()
            layer.position = CGPoint(x: -(scene!.size.width / 2), y: 0.0)
            layers.append(layer)
            
            layer = RPEmitterLayer()
            addChild(layer)
            layer.zPosition = 0
            layer.particleSize = 4.0
            layer.maxAlpha = 0.6
            layer.minAlpha = 0.4
            layer.parallaxFactor = 4
            layer.damping = 15.0
            layer.populate(numberOfColumns: 6, numberOfRows: 6)
            layer.setup()
            layer.position = CGPoint(x: -(scene!.size.width / 2), y: 0.0)
            layers.append(layer)
            
            layer = RPEmitterLayer()
            addChild(layer)
            layer.zPosition = -1
            layer.particleSize = 3.0
            layer.maxAlpha = 0.5
            layer.minAlpha = 0.25
            layer.parallaxFactor = 8
            layer.damping = 20.0
            layer.populate(numberOfColumns: 6, numberOfRows: 6)
            layer.setup()
            layer.position = CGPoint(x: -(scene!.size.width / 2), y: 0.0)
            layers.append(layer)
            
            layer = RPEmitterLayer()
            addChild(layer)
            layer.zPosition = -2
            layer.particleSize = 2.0
            layer.maxAlpha = 0.3
            layer.minAlpha = 0.25
            layer.parallaxFactor = 16
            layer.damping = 20.0
            layer.populate(numberOfColumns: 6, numberOfRows: 6)
            layer.setup()
            layer.position = CGPoint(x: -(scene!.size.width / 2), y: 0.0)
            layers.append(layer)
        }
        
        setupActionLayer()
        addLayers()
    }
    
    func update(currentTime: NSTimeInterval) {

        for layer: RPLayer in layers {
            
            layer.update(currentTime)
        }
    }
 
    func didFinishUpdate() {
        
        for layer: RPLayer in layers {
            
            layer.didFinishUpdate()
        }
    }
    
    func actionLayerDidFinishUpdatingCamera(withAbsolutePosition absolutePosition: CGPoint) {
        

    }
}

extension RPWorldNode {
    
    func cameraNodeDidFinishUpdating(theCamera cameraNode: RPCameraNode) {
        
        let absoluteCameraPosition = scene?.convertPoint(cameraNode.position, fromNode: cameraNode.parent!)
     
        for layer: RPLayer in layers {
            
            let factor = RPWorldNodeSettings.SmoothingFactor + layer.parallaxFactor
            layer.position = CGPoint(x: layer.position.x - (absoluteCameraPosition!.x / factor), y: layer.position.y - (absoluteCameraPosition!.y / factor))
        }
    }
}

extension RPWorldNode {
    
    func inputHandlerDidTap() {
        actionLayer.inputHandlerDidTap()
    }
    
    func inputHandlerDidChangeMotion(xAcceleration: CGFloat) {
        actionLayer.inputHandlerDidChangeMotion(xAcceleration)
    }
}
